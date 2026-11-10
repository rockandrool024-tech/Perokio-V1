import {
  Injectable, BadRequestException, NotFoundException, ConflictException,
} from '@nestjs/common';
import { prisma } from '@perokio/db';

// ============================================================================
// AdminService — the operational layer for the Studio
// Manages: script QA, video transcript checks, deviation overrides,
// print rating (with pass/fail gates), and the pipeline dashboard.
// ============================================================================

@Injectable()
export class AdminService {
  // ============================================================================
  // GET /admin/scripts — list all ScriptVersions in QA
  // ============================================================================

  async listScriptsInQa() {
    const versions = await prisma.scriptVersion.findMany({
      where: { status: 'in_qa' },
      include: {
        fact: {
          select: {
            id: true,
            tier: true,
            language: true,
            brandId: true,
            brand: { select: { name: true } },
          },
        },
        lines: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            position: true,
            text: true,
            isHook: true,
            durationSec: true,
            verified: true,
            sources: { include: { source: { select: { id: true, label: true, url: true, type: true } } } },
          },
        },
        receipts: { where: { invalidatedAt: null }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Augment with verified/total counts
    return versions.map((sv) => ({
      ...sv,
      brandName: sv.fact.brand.name,
      verifiedLines: sv.lines.filter((l) => l.verified).length,
      totalLines: sv.lines.length,
      hasActiveReceipt: sv.receipts.length > 0,
    }));
  }

  // ============================================================================
  // POST /admin/lines/:id/verify — human admin verifies a single line
  // The Harness CANNOT do this. Only a human can.
  // ============================================================================

  async verifyLine(lineId: string, reviewerId: string, sourceId?: string) {
    const line = await prisma.scriptLine.findUnique({
      where: { id: lineId },
      include: { sources: true },
    });
    if (!line) throw new NotFoundException(`ScriptLine ${lineId} not found`);

    if (line.verified) {
      throw new ConflictException(`ScriptLine ${lineId} is already verified`);
    }

    // If a sourceId is provided, link it
    if (sourceId) {
      const source = await prisma.source.findUnique({ where: { id: sourceId } });
      if (!source) throw new NotFoundException(`Source ${sourceId} not found`);

      // Create the ScriptLineSource join if it doesn't exist
      try {
        await prisma.scriptLineSource.create({
          data: { scriptLineId: lineId, sourceId },
        });
      } catch {
        // Already linked — that's fine
      }
    }

    // Mark the line as verified
    const updated = await prisma.scriptLine.update({
      where: { id: lineId },
      data: { verified: true },
    });

    // Move the script version to in_qa (if it was draft)
    await prisma.scriptVersion.updateMany({
      where: { id: line.scriptVersionId, status: 'draft' },
      data: { status: 'in_qa' },
    });

    return {
      verified: true,
      lineId,
      scriptVersionId: line.scriptVersionId,
      verifiedBy: reviewerId,
      sourceId: sourceId || null,
    };
  }

  // ============================================================================
  // POST /admin/videos/:id/transcript — submit speech-to-text, check for deviation
  // §D.2: Jaccard similarity < 0.7 → deviation detected
  // ============================================================================

  async submitTranscript(videoId: string, transcript: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        claim: {
          include: {
            fact: {
              include: {
                scriptVersions: {
                  where: { status: 'approved' },
                  include: { lines: { orderBy: { position: 'asc' } } },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    // Store the transcript
    await prisma.video.update({
      where: { id: videoId },
      data: { transcript },
    });

    // §D.7: If there's no approved script version, skip the check
    const approvedVersion = video.claim.fact.scriptVersions[0];
    if (!approvedVersion) {
      // No approved script → no B11 receipt → nothing to compare against
      await prisma.policyCheck.create({
        data: {
          videoId,
          checkType: 'script_match',
          result: 'pass',
          details: 'No approved script version found — transcript check skipped',
        },
      });
      return {
        videoId,
        transcript,
        checkResult: 'skipped',
        reason: 'No approved script version to compare against',
      };
    }

    // §D.2: Compare transcript to approved script using Jaccard similarity
    const scriptText = approvedVersion.lines.map((l) => l.text).join(' ');
    const similarity = this.jaccardSimilarity(transcript, scriptText);
    const DEVIATION_THRESHOLD = 0.7; // §D.2

    if (similarity < DEVIATION_THRESHOLD) {
      // Off-script deviation detected!
      await prisma.policyCheck.create({
        data: {
          videoId,
          checkType: 'script_match',
          result: 'fail',
          details: `Transcript deviates from approved script (Jaccard similarity: ${similarity.toFixed(3)} < ${DEVIATION_THRESHOLD})`,
        },
      });

      // Move video to held_factual_deviation
      await prisma.video.update({
        where: { id: videoId },
        data: { stage: 'held_factual_deviation' },
      });

      return {
        videoId,
        transcript,
        checkResult: 'fail',
        reason: 'Transcript deviates from approved script',
        similarity: similarity.toFixed(3),
        threshold: DEVIATION_THRESHOLD,
        newStage: 'held_factual_deviation',
      };
    }

    // Pass
    await prisma.policyCheck.create({
      data: {
        videoId,
        checkType: 'script_match',
        result: 'pass',
        details: `Transcript matches approved script (Jaccard similarity: ${similarity.toFixed(3)} >= ${DEVIATION_THRESHOLD})`,
      },
    });

    return {
      videoId,
      transcript,
      checkResult: 'pass',
      similarity: similarity.toFixed(3),
      threshold: DEVIATION_THRESHOLD,
    };
  }

  // ============================================================================
  // POST /admin/videos/:id/override-deviation — admin overrides off-script
  // §0 lock 3: invalidates the VerificationReceipt + logs PolicyCheck override
  // ============================================================================

  async overrideDeviation(videoId: string, adminId: string, reason?: string) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        claim: {
          include: {
            fact: {
              include: {
                scriptVersions: {
                  where: { status: 'approved' },
                  include: { receipts: { where: { invalidatedAt: null } } },
                },
              },
            },
          },
        },
        policyChecks: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    if (video.stage !== 'held_factual_deviation') {
      throw new BadRequestException(
        `Video is in stage '${video.stage}' — can only override from 'held_factual_deviation'`,
      );
    }

    // 1. Create the override PolicyCheck
    const overrideCheck = await prisma.policyCheck.create({
      data: {
        videoId,
        checkType: 'off_script_override',
        result: 'override',
        details: `Brand override by ${adminId}${reason ? ': ' + reason : ''}. Original B11 receipt invalidated for this video.`,
      },
    });

    // 2. Move video back to locked_pending (brand review queue)
    await prisma.video.update({
      where: { id: videoId },
      data: { stage: 'locked_pending' },
    });

    // 3. Invalidate the VerificationReceipt
    //    (we don't delete it — we mark invalidatedAt for the audit trail)
    const approvedVersion = video.claim.fact.scriptVersions[0];
    let invalidatedReceiptId: string | null = null;

    if (approvedVersion && approvedVersion.receipts.length > 0) {
      const receipt = approvedVersion.receipts[0];
      await prisma.verificationReceipt.update({
        where: { id: receipt.id },
        data: {
          invalidatedAt: new Date(),
          invalidatedBy: adminId,
          invalidatedReason: `Off-script override for video ${videoId}${reason ? ': ' + reason : ''}`,
        },
      });
      invalidatedReceiptId = receipt.id;
    }

    return {
      overridden: true,
      videoId,
      policyCheckId: overrideCheck.id,
      invalidatedReceiptId,
      newStage: 'locked_pending',
      overriddenBy: adminId,
      reason: reason || null,
    };
  }

  // ============================================================================
  // POST /admin/videos/:id/rate — pass/fail gates + weighted score
  // §0 lock 2: both brandSafety AND scriptMatch must be true
  // ============================================================================

  async rateVideo(
    videoId: string,
    reviewerId: string,
    payload: { brandSafety: boolean; scriptMatch: boolean; craft: number; hook: number; notes?: string },
  ) {
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { printRating: true },
    });

    if (!video) throw new NotFoundException(`Video ${videoId} not found`);

    // §D.6: No re-rating allowed
    if (video.printRating) {
      throw new ConflictException(`Video ${videoId} already has a PrintRating`);
    }

    // Validate scores
    const { brandSafety, scriptMatch, craft, hook, notes } = payload;
    if (craft < 1 || craft > 5) throw new BadRequestException('craft score must be 1-5');
    if (hook < 1 || hook > 5) throw new BadRequestException('hook score must be 1-5');

    // §0 lock 2: Both gates must pass
    if (!brandSafety || !scriptMatch) {
      throw new BadRequestException({
        error: 'RATING_GATES_FAILED',
        message: 'Video rating rejected: both brandSafety and scriptMatch must be true to pass.',
        gates: { brandSafety, scriptMatch },
        failedGates: [
          ...(!brandSafety ? ['brand_safety'] : []),
          ...(!scriptMatch ? ['script_match'] : []),
        ],
      });
    }

    // §D.3: Calculate overallScore = (craft + hook) / 2
    const overallScore = (craft + hook) / 2;

    // Create the PrintRating
    const rating = await prisma.printRating.create({
      data: {
        videoId,
        reviewerId,
        brandSafety: true,
        scriptMatch: true,
        craftScore: craft,
        hookScore: hook,
        overallScore,
        notes: notes || null,
      },
    });

    // Move video to approved_queued
    await prisma.video.update({
      where: { id: videoId },
      data: { stage: 'approved_queued' },
    });

    return {
      rated: true,
      ratingId: rating.id,
      videoId,
      overallScore,
      craftScore: craft,
      hookScore: hook,
      newStage: 'approved_queued',
    };
  }

  // ============================================================================
  // GET /admin/pipeline — dashboard counts
  // ============================================================================

  async getPipeline() {
    const [
      factsDraft,
      factsInQa,
      factsLive,
      videosLockedPending,
      videosApprovedQueued,
      videosHeldDeviation,
      videosPublished,
      videosSettled,
    ] = await Promise.all([
      prisma.fact.count({ where: { status: 'draft' } }),
      prisma.fact.count({ where: { status: 'in_qa' } }),
      prisma.fact.count({ where: { status: 'live' } }),
      prisma.video.count({ where: { stage: 'locked_pending' } }),
      prisma.video.count({ where: { stage: 'approved_queued' } }),
      prisma.video.count({ where: { stage: 'held_factual_deviation' } }),
      prisma.video.count({ where: { stage: 'published' } }),
      prisma.video.count({ where: { stage: 'settled' } }),
    ]);

    // Recent activity (last 20 events)
    const recentEvents = await prisma.domainEvent.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      select: { id: true, eventType: true, entityId: true, timestamp: true, payload: true },
    });

    return {
      facts: {
        draft: factsDraft,
        in_qa: factsInQa,
        live: factsLive,
        total: factsDraft + factsInQa + factsLive,
      },
      videos: {
        locked_pending: videosLockedPending,
        approved_queued: videosApprovedQueued,
        held_factual_deviation: videosHeldDeviation,
        published: videosPublished,
        settled: videosSettled,
        needsAttention: videosLockedPending + videosHeldDeviation,
      },
      recentEvents,
    };
  }

  // ============================================================================
  // Private helpers
  // ============================================================================

  /** Jaccard similarity on word sets — crude but effective for V1 (§D.2) */
  private jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(this.tokenize(a));
    const setB = new Set(this.tokenize(b));
    if (setA.size === 0 && setB.size === 0) return 1;
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    for (const word of setA) {
      if (setB.has(word)) intersection++;
    }
    const union = setA.size + setB.size - intersection;
    return intersection / union;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2); // skip short words (a, an, the, etc.)
  }
}
