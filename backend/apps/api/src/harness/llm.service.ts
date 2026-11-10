import { Injectable, Logger } from '@nestjs/common';

// ============================================================================
// LlmService — Mock LLM client simulating OpenRouter
// ============================================================================
// §D.1: The mock is deterministic. It returns 3 script lines per prompt.
//       If the prompt contains hallucination keywords (cure, diabetes, FDA,
//       guarantee, 100%, weight loss), the mock SIMULATES an LLM trying to
//       verify a fake claim — it marks the lines as "hallucinated" so the
//       eval endpoint can detect them.
//
//       In V1 we never actually call a real LLM. In V2 we swap this for the
//       OpenRouter API client.
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

export interface LlmScriptLine {
  position: number;
  text: string;
  isHook: boolean;
  durationSec: number;
  hallucinated: boolean; // true if the LLM tried to verify a fake claim
}

export interface LlmGenerationResult {
  lines: LlmScriptLine[];
  tokensUsed: number;
  costUsd: number;
  model: string;
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  /**
   * generateScript — mock LLM call.
   * Returns a JSON array of script lines based on the prompt.
   * If hallucination keywords are detected, lines are flagged.
   */
  async generateScript(prompt: string, model: string = 'claude-3.5-sonnet'): Promise<LlmGenerationResult> {
    this.logger.log(`🤖 Generating script with ${model} (prompt: "${prompt.substring(0, 60)}...")`);

    // Simulate API latency
    await new Promise((r) => setTimeout(r, 200));

    // Check for hallucination triggers
    const promptLower = prompt.toLowerCase();
    const hallucinated = HALLUCINATION_KEYWORDS.some((kw) => promptLower.includes(kw));

    if (hallucinated) {
      // The LLM "hallucinated" — it tried to verify a fake claim
      // In a real system, the LLM would output a line claiming the cure/guarantee
      // and might try to map a source. Our eval detects this.
      this.logger.warn(`⚠️  Hallucination detected in prompt (contains forbidden keywords)`);
      return {
        lines: [
          {
            position: 0,
            text: prompt, // The LLM echoed the fake claim
            isHook: true,
            durationSec: 5,
            hallucinated: true,
          },
        ],
        tokensUsed: 850,
        costUsd: 0.012,
        model,
      };
    }

    // Normal generation — 3 script lines, all unverified
    const topic = this.extractTopic(prompt);
    return {
      lines: [
        {
          position: 0,
          text: `Did you know? ${topic} — here's the verified story.`,
          isHook: true,
          durationSec: 5,
          hallucinated: false,
        },
        {
          position: 1,
          text: `The data comes from an official source, independently verified by our team.`,
          isHook: false,
          durationSec: 6,
          hallucinated: false,
        },
        {
          position: 2,
          text: `Follow for more facts you can trust. #PerokioVerified`,
          isHook: false,
          durationSec: 4,
          hallucinated: false,
        },
      ],
      tokensUsed: 1200,
      costUsd: 0.018,
      model,
    };
  }

  private extractTopic(prompt: string): string {
    // Crude extraction — take the first 60 chars of the prompt as the topic
    return prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
  }

  /** Check if a prompt would trigger hallucination (used by the eval endpoint) */
  wouldHallucinate(prompt: string): boolean {
    const promptLower = prompt.toLowerCase();
    return HALLUCINATION_KEYWORDS.some((kw) => promptLower.includes(kw));
  }
}
