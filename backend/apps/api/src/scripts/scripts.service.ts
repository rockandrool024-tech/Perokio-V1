import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@perokio/db';
import * as crypto from 'crypto';

@Injectable()
export class ScriptsService {
  // ============================================================================
  // CRUD: ScriptLine
  // ============================================================================

  async addLine(scriptVersionId: string, data: { text: string; position?: number; isHook?: boolean; durationSec?: number }) {
    // Determine position if not provided
    const existing = await prisma.scriptLine.count({ where: { scriptVersionId } });
    return prisma.scriptLine.create({
      data: {
        scriptVersionId,
        text: data.text,
        position: data.position ?? existing,
        isHook: data.isHook ?? false,
        durationSec: data.durationSec ?? 5,
        verified: false, // Always starts unverified
      },
    });
  }

  async updateLine(lineId: string, data: { text?: string; durationSec?: number }) {
    const line = await prisma.scriptLine.findUnique({ where: { id: lineId } });
    if (!line) throw new NotFoundException(`ScriptLine ${lineId} not found`);

    // §3 Un-verification: any edit to the text resets verified=false and invalidates the receipt
    const updates: any = {};
    if (data.text !== undefined && data.text !== line.text) {
      updates.text = data.text;
      updates.verified = false; // Reset on text change
    }
    if (data.durationSec !== undefined) updates.durationSec = data.durationSec;

    const updated = await prisma.scriptLine.update({
      where: { id: lineId },
      data: updates,
    });

    // If we reset verified=false, invalidate the receipt for this script version
    if (updates.verified === false) {
      await this.invalidateReceiptForVersion(line.scriptVersionId, 'ScriptLine edited');
    }

    return updated;
  }

  async linkSource(lineId: string, sourceId: string) {
    // Verify the source exists
    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) throw new NotFoundException(`Source ${sourceId} not found`);

    // Create the join
    const link = await prisma.scriptLineSource.create({
      data: { scriptLineId: lineId, sourceId },
    }).catch(() => {
      throw new BadRequestException('Source already linked to this line');
    });

    // Mark line as verified
    await prisma.scriptLine.update({
      where: { id: lineId },
      data: { verified: true },
    });

    return link;
  }

  async unlinkSource(lineId: string, sourceId: string) {
    await prisma.scriptLineSource.delete({
      where: { scriptLineId_sourceId: { scriptLineId: lineId, sourceId } },
    });

    // If no more sources remain, mark line as unverified
    const remaining = await prisma.scriptLineSource.count({ where: { scriptLineId: lineId } });
    if (remaining === 0) {
      await prisma.scriptLine.update({
        where: { id: lineId },
        data: { verified: false },
      });
      await this.invalidateReceiptForVersion(
        (await prisma.scriptLine.findUnique({ where: { id: lineId } }))!.scriptVersionId,
        'Source removed — line unverified',
      );
    }
  }

  // ============================================================================
  // Source library
  // ============================================================================

  async createSource(data: { label: string; url: string; type: string; verifiedBy: string }) {
    return prisma.source.create({ data });
  }

  async listSources() {
    return prisma.source.findMany({ include: { lineSources: true } });
  }

  // ============================================================================
  // THE B11 GATE — POST /scripts/:id/approve (CRITICAL)
  // ============================================================================

  async approve(scriptVersionId: string, reviewerId: string) {
    // --- APP-LEVEL CHECK ---
    // Query all ScriptLines for this version. If ANY has verified=false → 400.
    const version = await prisma.scriptVersion.findUnique({
      where: { id: scriptVersionId },
      include: {
        lines: { orderBy: { position: 'asc' } },
      },
    });

    if (!version) {
      throw new NotFoundException(`ScriptVersion ${scriptVersionId} not found`);
    }

    if (version.status === 'approved') {
      throw new BadRequestException('ScriptVersion is already approved');
    }

    const unverifiedLines = version.lines.filter((l) => !l.verified);

    if (unverifiedLines.length > 0) {
      // §3 B11 Gate Proof: 400 with the offending line IDs
      throw new BadRequestException({
        error: 'B11_VERIFICATION_FAILED',
        message: `${unverifiedLines.length} of ${version.lines.length} script lines are unverified. Publishing is blocked.`,
        unverifiedLines: unverifiedLines.map((l) => ({
          lineId: l.id,
          position: l.position,
          text: l.text,
        })),
      });
    }

    // --- DB-LEVEL GUARD (defense in depth) ---
    // Raw SQL assertion: even if app-level check is bypassed, the DB refuses.
    const unverifiedCount: { count: bigint }[] = await prisma.$queryRaw`
      SELECT COUNT(*)::bigint as count FROM "ScriptLine"
      WHERE "scriptVersionId" = ${scriptVersionId} AND verified = false
    `;
    if (Number(unverifiedCount[0].count) > 0) {
      throw new BadRequestException({
        error: 'B11_DB_GUARD_FAILED',
        message: 'DB-level guard detected unverified lines. This should never happen.',
      });
    }

    // --- THE RECEIPT ---
    // SHA-256 of canonical JSON { scriptVersionId, lines: [{position, text, sources}], reviewerId }
    const linesWithSources = await prisma.scriptLine.findMany({
      where: { scriptVersionId },
      include: { sources: { include: { source: true } } },
      orderBy: { position: 'asc' },
    });

    const canonical = JSON.stringify({
      scriptVersionId,
      lines: linesWithSources.map((l) => ({
        position: l.position,
        text: l.text,
        sources: l.sources.map((s) => ({
          label: s.source.label,
          url: s.source.url,
          type: s.source.type,
        })),
      })),
      reviewerId,
      approvedAt: new Date().toISOString(),
    });

    const hash = crypto.createHash('sha256').update(canonical).digest('hex');

    // --- ATOMIC APPROVAL + RECEIPT CREATION ---
    const [receipt] = await prisma.$transaction([
      // Create the receipt
      prisma.verificationReceipt.create({
        data: {
          scriptVersionId,
          hash,
          reviewerId,
        },
      }),
      // Mark the script version as approved
      prisma.scriptVersion.update({
        where: { id: scriptVersionId },
        data: { status: 'approved' },
      }),
      // Update the parent Fact status
      prisma.fact.update({
        where: { id: version.factId },
        data: { status: 'approved' },
      }),
    ]);

    return {
      approved: true,
      scriptVersionId,
      factId: version.factId,
      receiptId: receipt.id,
      hash: receipt.hash,
      verifiedLines: linesWithSources.length,
    };
  }

  /** Invalidate the active receipt for a script version (used on un-verification) */
  private async invalidateReceiptForVersion(scriptVersionId: string, reason: string) {
    await prisma.verificationReceipt.updateMany({
      where: {
        scriptVersionId,
        invalidatedAt: null,
      },
      data: {
        invalidatedAt: new Date(),
        invalidatedReason: reason,
      },
    });

    // Also reset the script version status to in_qa (needs re-approval)
    await prisma.scriptVersion.updateMany({
      where: { id: scriptVersionId, status: 'approved' },
      data: { status: 'in_qa' },
    });
  }

  // ============================================================================
  // Off-script override (§4 held_factual_deviation)
  // ============================================================================

  async overrideOffScript(videoId: string, brandUserId: string) {
    // 1. Create a PolicyCheck override record
    const check = await prisma.policyCheck.create({
      data: {
        videoId,
        checkType: 'off_script_override',
        result: 'override',
        details: `Brand override by ${brandUserId}. Original B11 receipt invalidated for this video.`,
      },
    });

    // 2. Move video back to approved_queued (from held_factual_deviation)
    await prisma.video.update({
      where: { id: videoId },
      data: { stage: 'approved_queued' },
    });

    // 3. Mark the associated VerificationReceipt as invalidated
    //    (We don't delete it — we mark invalidatedAt so there's an audit trail)
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        claim: { include: { fact: { include: { scriptVersions: true } } } },
      },
    });

    if (video) {
      const approvedVersion = video.claim.fact.scriptVersions.find((v) => v.status === 'approved');
      if (approvedVersion) {
        await prisma.verificationReceipt.updateMany({
          where: {
            scriptVersionId: approvedVersion.id,
            invalidatedAt: null,
          },
          data: {
            invalidatedAt: new Date(),
            invalidatedBy: brandUserId,
            invalidatedReason: `Off-script override for video ${videoId}`,
          },
        });
      }
    }

    return { overridden: true, videoId, policyCheckId: check.id };
  }
}
