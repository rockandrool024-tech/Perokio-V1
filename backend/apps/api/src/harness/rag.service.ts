import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@perokio/db';

// ============================================================================
// RagService — assembles the RAG context for the LLM
// ============================================================================
// This service retrieves the brand's context (industry, voice, audience,
// guidelines), the fact's rawClaim + verifiedSources, and constructs the
// RAGContext object that the LlmService uses to generate grounded scripts.
//
// The validation gate (HALLUCINATION_DETECTED) lives in HarnessService,
// not here — this service only assembles the context.
// ============================================================================

export interface RagSource {
  id: string
  url: string
  label: string
  type: string
}

export interface RagBrandContext {
  industry: string | null
  targetAudience: string | null
  brandVoice: string | null
  guidelines: string | null
}

export interface RagContext {
  rawClaim: string
  verifiedSources: RagSource[]
  brandContext?: RagBrandContext
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  /**
   * assembleContext — retrieves all RAG inputs for a Fact
   *
   * 1. Fact.rawClaim (the brand's original unverified claim)
   * 2. Fact.verifiedSources (JSON array) + Source records from approved ScriptVersion
   * 3. BrandContext (industry, targetAudience, brandVoice, guidelines)
   * 4. BrandAssets with tag "tone_guide" (for brand voice matching)
   */
  async assembleContext(factId: string): Promise<RagContext> {
    const fact = await prisma.fact.findUnique({
      where: { id: factId },
      include: {
        brand: {
          include: {
            context: true,
            assets: { where: { tags: { has: 'tone_guide' } }, take: 3 },
          },
        },
        scriptVersions: {
          where: { status: 'approved' },
          include: {
            lines: {
              include: {
                sources: { include: { source: true } },
              },
            },
          },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!fact) {
      throw new Error(`Fact ${factId} not found`);
    }

    // Extract verified sources from the latest approved ScriptVersion
    const approvedVersion = fact.scriptVersions[0];
    const verifiedSources: RagSource[] = approvedVersion
      ? approvedVersion.lines
          .flatMap((l) => l.sources.map((s) => s.source))
          .filter((s, idx, arr) => arr.findIndex((x) => x.id === s.id) === idx)
          .map((s) => ({ id: s.id, url: s.url, label: s.label, type: s.type }))
      : [];

    // Merge in sources from Fact.verifiedSources (JSON)
    const factStoredSources = (fact.verifiedSources as any[]) || [];
    const allSources: RagSource[] = [
      ...verifiedSources,
      ...factStoredSources
        .filter((s) => !verifiedSources.find((v) => v.id === s.id || v.url === s.url))
        .map((s) => ({
          id: s.id || s.url,
          url: s.url,
          label: s.label || s.url,
          type: s.type || 'official',
        })),
    ];

    const ragContext: RagContext = {
      rawClaim: fact.rawClaim || fact.topic || `Verified fact about ${fact.tier}`,
      verifiedSources: allSources,
      brandContext: fact.brand.context
        ? {
            industry: fact.brand.context.industry,
            targetAudience: fact.brand.context.targetAudience,
            brandVoice: fact.brand.context.brandVoice,
            guidelines: fact.brand.context.guidelines,
          }
        : undefined,
    };

    this.logger.log(
      `📚 RAG context assembled for fact ${factId}: ${allSources.length} sources, ` +
      `brandVoice=${ragContext.brandContext?.brandVoice || 'none'}, ` +
      `audience=${ragContext.brandContext?.targetAudience?.substring(0, 30) || 'none'}`,
    );

    return ragContext;
  }

  /**
   * validateSourceIds — checks that all suggestedSourceIds from the LLM
   * are in the verifiedSources list. Returns the invalid ones.
   *
   * This is the HALLUCINATION_DETECTION gate. Called by HarnessService
   * after the LLM returns its response.
   */
  validateSourceIds(
    suggestedSourceIds: (string | null)[],
    verifiedSources: RagSource[],
  ): { valid: boolean; invalidIds: string[] } {
    const validIds = new Set(verifiedSources.map((s) => s.id));
    const invalidIds = suggestedSourceIds.filter(
      (id): id is string => id !== null && !validIds.has(id),
    );

    return {
      valid: invalidIds.length === 0,
      invalidIds,
    };
  }
}
