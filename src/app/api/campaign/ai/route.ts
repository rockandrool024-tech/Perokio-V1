// ============================================================================
// AI Campaign Editor Route — OpenRouter proxy for Chai Builder
// ============================================================================
// This route receives the current Chai Builder block tree + the user's
// natural language prompt, sends them to OpenRouter (Claude 3.5 Sonnet),
// and returns the modified block tree.
//
// The AI is instructed to:
//   1. Take the current blocks JSON
//   2. Apply the user's requested changes
//   3. Return ONLY the modified JSON (no markdown, no explanation)
//
// Usage:
//   POST /api/campaign/ai
//   Body: { type: "content" | "styles", prompt: string, blocks: ChaiBlock[], lang: string }
//   Response: { blocks: ChaiBlock[] }
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet'

const SYSTEM_PROMPT = `You are Perokio's AI Campaign Editor assistant. Your job is to modify Chai Builder block trees based on natural language instructions from the brand.

RULES:
1. You receive a JSON array of Chai Builder blocks and a user instruction.
2. Apply the requested changes to the blocks (modify content, styles, props, add/remove blocks).
3. Return ONLY the modified JSON array. No markdown, no explanation, no code fences.
4. Preserve block _id, _type, and _name fields. Only modify content, styles, and props.
5. If the user asks to change a headline, modify the Hero block's content field.
6. If the user asks to change a CTA, modify the SparkCTA block's ctaText prop.
7. If the user asks to add a countdown, insert a CountdownTimer block before the CTA.
8. If the user asks to change colors, modify the styles field of the relevant block.
9. Always respond with valid JSON. The response must be parseable as a JSON array.

BLOCK TYPES:
- Hero: { _id, _type: "Hero", _name, content: string, styles: string, props: { ctaText, ctaHref } }
- SocialProof: { _id, _type: "SocialProof", _name, content: string, styles: string }
- TastyIgniterMenuBlock: { _id, _type: "TastyIgniterMenuBlock", _name, styles: string, props: { menuCategory, maxItems, columns } }
- CountdownTimer: { _id, _type: "CountdownTimer", _name, styles: string, props: { duration, label, variant } }
- SparkCTA: { _id, _type: "SparkCTA", _name, content: string, styles: string, props: { shortlink, ctaText, variant } }
- CardGrid: { _id, _type: "CardGrid", _name, styles: string, props: { items: [{ title, description }] } }

COLOR TOKENS (use these in styles):
- Lime: bg-lime-400, text-lime-400, from-lime-400
- Orange: bg-orange-500, text-orange-500, from-orange-500
- Red: bg-red-600, text-red-700
- Teal: from-teal-500, text-teal-500
- Dark: bg-black, text-black

Return ONLY the JSON array. No other text.`

export async function POST(req: NextRequest) {
  try {
    const { type, prompt, blocks, lang } = await req.json()

    if (!prompt || !blocks) {
      return NextResponse.json({ error: 'Missing prompt or blocks' }, { status: 400 })
    }

    // If no API key, return mock response (demo mode)
    if (!OPENROUTER_API_KEY) {
      console.log('[AI Route] No OPENROUTER_API_KEY — returning mock response')
      return NextResponse.json({
        blocks: applyMockChanges(blocks, prompt, type),
        usage: { mock: true },
      })
    }

    // Call OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://perokio.com',
        'X-Title': 'Perokio Campaign Editor',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `User instruction: "${prompt}"\n\nCurrent blocks (${type} edit, lang: ${lang}):\n${JSON.stringify(blocks, null, 2)}\n\nReturn the modified blocks JSON array only.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[AI Route] OpenRouter error:', response.status, errText)
      return NextResponse.json({ error: `OpenRouter error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'No content in AI response' }, { status: 502 })
    }

    // Parse the AI response — it should be a JSON array
    let modifiedBlocks
    try {
      // Strip any markdown code fences if present
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      modifiedBlocks = JSON.parse(cleaned)
    } catch {
      // If parsing fails, return the original blocks
      console.error('[AI Route] Failed to parse AI response as JSON')
      return NextResponse.json({
        blocks: blocks,
        error: 'AI response was not valid JSON',
      })
    }

    return NextResponse.json({
      blocks: modifiedBlocks,
      usage: data.usage,
    })
  } catch (e: any) {
    console.error('[AI Route] Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// ============================================================================
// Mock change applicator — used when no OPENROUTER_API_KEY is set
// ============================================================================

function applyMockChanges(blocks: any[], prompt: string, type: string): any[] {
  const lowerPrompt = prompt.toLowerCase()

  return blocks.map((block) => {
    const modified = { ...block }

    // "Change the headline to X"
    if (block._type === 'Hero' && type === 'content') {
      const headlineMatch = prompt.match(/(?:headline|title|hero)[^"]*["'](.+?)["']/i)
        || prompt.match(/(?:change|set|update)[^"]*["'](.+?)["']/i)
      if (headlineMatch) {
        modified.content = headlineMatch[1]
      }
    }

    // "Change the CTA to X"
    if (block._type === 'SparkCTA' && type === 'content') {
      const ctaMatch = prompt.match(/(?:cta|button)[^"]*["'](.+?)["']/i)
        || prompt.match(/(?:change|set).*(?:order|buy|call).*(?:to|text)[^"]*["'](.+?)["']/i)
      if (ctaMatch) {
        modified.props = { ...modified.props, ctaText: ctaMatch[1] }
      }
    }

    // "Change social proof to X"
    if (block._type === 'SocialProof' && type === 'content') {
      if (lowerPrompt.includes('social') || lowerPrompt.includes('proof')) {
        const match = prompt.match(/["'](.+?)["']/)
        if (match) modified.content = match[1]
      }
    }

    // "Make the countdown 24h" or "Set timer to X"
    if (block._type === 'CountdownTimer' && type === 'content') {
      const durationMatch = prompt.match(/(\d+)\s*(h|hour|hours|d|day|days)/i)
      if (durationMatch) {
        const num = durationMatch[1]
        const unit = durationMatch[2].toLowerCase().startsWith('d') ? 'd' : 'h'
        modified.props = { ...modified.props, duration: `${num}${unit}` }
      }
    }

    return modified
  })
}
