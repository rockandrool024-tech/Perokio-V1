import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// LlmService — Mock LLM client simulating OpenRouter (RAG-enabled)
// ============================================================================
// B4.5 — The RAG Pipeline:
//   1. The service receives a RAG context: rawClaim, verifiedSources, brandContext
//   2. It builds a system prompt that STRICTLY instructs the LLM to map each
//      generated script line to a source_id from verifiedSources.
//   3. The mock simulates the LLM's response — it returns lines, each with
//      a suggestedSourceId (still unverified; only a human can confirm).
//   4. If hallucination keywords are detected in the prompt, the mock
//      simulates an LLM trying to verify a fake claim (eval fails).
//
// In V1, the mock is deterministic. In V2, swap for OpenRouter API calls.
// The interface (generateScriptWithRAG → { lines, tokensUsed, costUsd }) stays identical.
// ============================================================================

const HALLUCINATION_KEYWORDS = [
  'cure', 'cures', 'curing',
  'diabetes',
  'fda', 'fda-approved',
  'guarantee', 'guaranteed', 'guarantees',
  '100%', '100 percent',
  'weight loss',
  'heart disease',
  'cancer',
];

export interface RAGContext {
  rawClaim: string;
  verifiedSources: Array<{ id: string; url: string; label: string; type: string }>;
  brandContext?: {
    industry?: string | null;
    targetAudience?: string | null;
    brandVoice?: string | null;
    guidelines?: string | null;
  };
}

export interface LlmScriptLine {
  position: number;
  text: string;
  isHook: boolean;
  durationSec: number;
  suggestedSourceId: string | null; // B4.5: LLM suggests a source, but verified=false until human confirms
  hallucinated: boolean;
}

export interface LlmGenerationResult {
  lines: LlmScriptLine[];
  tokensUsed: number;
  costUsd: number;
  model: string;
  ragContext: RAGContext;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  /**
   * generateScriptWithRAG — the RAG-enabled generation method (B4.5)
   *
   * Builds a system prompt that:
   *   1. Provides the raw claim and verified sources as context
   *   2. STRICTLY instructs the LLM to map each line to a source_id
   *   3. Includes brand voice / audience / guidelines for tone matching
   *
   * The mock simulates this by returning lines with suggestedSourceId set.
   * The source suggestion is NOT a verification — verified stays false.
   */
  async generateScriptWithRAG(
    prompt: string,
    ragContext: RAGContext,
    model: string = 'claude-3.5-sonnet',
  ): Promise<LlmGenerationResult> {
    this.logger.log(`🤖 Generating script with RAG context (model: ${model}, sources: ${ragContext.verifiedSources.length})`);

    // Build the system prompt that the LLM would receive
    const systemPrompt = this.buildRAGSystemPrompt(ragContext);
    this.logger.debug(`System prompt: ${systemPrompt.substring(0, 120)}...`);

    // Simulate API latency
    await new Promise((r) => setTimeout(r, 200));

    // Check for hallucination triggers
    const promptLower = (prompt + ' ' + ragContext.rawClaim).toLowerCase();
    const hallucinated = HALLUCINATION_KEYWORDS.some((kw) => promptLower.includes(kw));

    if (hallucinated) {
      this.logger.warn('⚠️  Hallucination detected — LLM tried to verify a fake claim');
      return {
        lines: [
          {
            position: 0,
            text: ragContext.rawClaim || prompt,
            isHook: true,
            durationSec: 5,
            suggestedSourceId: null, // No source can back a fake claim
            hallucinated: true,
          },
        ],
        tokensUsed: 850,
        costUsd: 0.012,
        model,
        ragContext,
      };
    }

    // Normal generation — 3 lines, each mapped to a suggested source
    // The mock distributes the verified sources across the lines
    const sources = ragContext.verifiedSources;
    const lines: LlmScriptLine[] = [
      {
        position: 0,
        text: this.generateHookLine(ragContext),
        isHook: true,
        durationSec: 5,
        // Hook line maps to the first source (if any)
        suggestedSourceId: sources[0]?.id || null,
        hallucinated: false,
      },
      {
        position: 1,
        text: this.generateContextLine(ragContext),
        isHook: false,
        durationSec: 6,
        // Second line maps to the second source (or the first if only one)
        suggestedSourceId: sources[1]?.id || sources[0]?.id || null,
        hallucinated: false,
      },
      {
        position: 2,
        text: `Follow for more facts you can trust. #PerokioVerified`,
        isHook: false,
        durationSec: 4,
        // Outro line — no source needed (CTA)
        suggestedSourceId: null,
        hallucinated: false,
      },
    ];

    return {
      lines,
      tokensUsed: 1200 + sources.length * 50,
      costUsd: 0.018 + sources.length * 0.001,
      model,
      ragContext,
    };
  }

  /**
   * buildRAGSystemPrompt — constructs the system prompt sent to the LLM
   * This is the core of the RAG pipeline: it grounds the LLM in verified facts.
   */
  private buildRAGSystemPrompt(rag: RAGContext): string {
    const sourcesList = rag.verifiedSources.length > 0
      ? rag.verifiedSources.map((s, i) => `  [${i + 1}] source_id="${s.id}" — ${s.label} (${s.type})\n      URL: ${s.url}`).join('\n')
      : '  (no verified sources provided)';

    const brandCtx = rag.brandContext;
    const brandInstructions = brandCtx
      ? `BRAND CONTEXT:
  - Industry: ${brandCtx.industry || 'unspecified'}
  - Target audience: ${brandCtx.targetAudience || 'unspecified'}
  - Brand voice: ${brandCtx.brandVoice || 'neutral, factual'}
  - Guidelines: ${brandCtx.guidelines || 'none provided'}`
      : 'BRAND CONTEXT: (none provided)';

    return `You are Perokio's script generation assistant. Your job is to generate a 20-second TikTok script for a verified fact bundle.

STRICT RULES:
1. You MUST ground every factual line in one of the verified sources listed below.
2. For each line, set "suggestedSourceId" to the source_id that backs the claim.
3. If a line is a CTA or outro (no factual claim), set "suggestedSourceId" to null.
4. You MUST NOT invent new claims or sources. If the raw claim is not backed by a source, do not generate a line for it.
5. Keep the total duration between 15-20 seconds.
6. Match the brand voice and target audience exactly.

RAW CLAIM (brand's original statement):
${rag.rawClaim || '(no raw claim provided)'}

VERIFIED SOURCES (you may ONLY reference these):
${sourcesList}

${brandInstructions}

Respond with a JSON array of script lines. Each line: { position, text, isHook, durationSec, suggestedSourceId }.`;
  }

  private generateHookLine(rag: RAGContext): string {
    const claim = rag.rawClaim || 'this verified fact';
    const audience = rag.brandContext?.targetAudience;
    if (audience) {
      return `Hey ${audience.split(',')[0]} — did you know? ${claim.substring(0, 60)}.`;
    }
    return `Did you know? ${claim.substring(0, 80)}. Here's the verified story.`;
  }

  private generateContextLine(rag: RAGContext): string {
    const source = rag.verifiedSources[0];
    if (source) {
      return `This is backed by ${source.label} — independently verified by our team.`;
    }
    return `The data comes from an official source, independently verified by our team.`;
  }

  /** Check if a prompt would trigger hallucination (used by the eval endpoint) */
  wouldHallucinate(prompt: string): boolean {
    const promptLower = prompt.toLowerCase();
    return HALLUCINATION_KEYWORDS.some((kw) => promptLower.includes(kw));
  }
}
