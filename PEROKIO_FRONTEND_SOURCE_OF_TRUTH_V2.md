# 🦜 PEROKIO FRONTEND SOURCE OF TRUTH V2 — The Campaign & Link Engine

> **Status:** V2. The Campaign & Link Lifecycle is now the central operating system.
> **Previous:** V1.1 (Revenue OS components — CampaignStudio, CommandCenterToolbar, etc.)
> **Date:** November 2026

---

## NEW SECTION: THE CAMPAIGN & LINK ENGINE

This section documents the 3-phase Campaign & Link Lifecycle that serves as the central operating system for the brand. It justifies the $499/mo price point by proving measurable ROI.

### The 3 Phases

| Phase | Name | Purpose | Store Action | Entry Points |
|---|---|---|---|---|
| 1 | **Link Creation** (The Hook) | Generate a `pero.to/` shortlink with A/B routing | `setCampaignShortlink(slug)` | B10 [Build Campaign], B08 [Create New Promo Cycle] |
| 2 | **Page Editing** (The Value) | Build a conversion-optimized landing page with a live mobile preview | `saveCampaignPage(content)` | Phase 1 → "Build Landing Page" button |
| 3 | **Funnel Monitoring** (The ROI) | Track Views → Clicks → Page Views → Orders → Revenue from TastyIgniter webhooks | `setCampaignFunnel(data)` | B08 [View Campaigns], B10 [Monitor Campaign], A08 Total Clicks/Revenue cards |

### State Management: `activeCampaign` in the Zustand Store

The campaign lifecycle is tracked in the main Zustand store (`src/store/perokio.ts`):

```typescript
activeCampaign: {
  id: string | null              // "camp_1700000000" — set on first save
  shortlink: string | null        // "pero.to/spicy-chicken" — set in Phase 1
  pageContent: {                  // set in Phase 2
    headline: string
    subhead: string
    ctaText: string
    socialProof: string
    heroImageR2Key: string | null
  } | null
  funnelData: {                   // set in Phase 3 (from GET /api/conversion/stats)
    views: number
    clicks: number
    pageViews: number
    orders: number
    revenueCents: number
  } | null
}
```

**Store actions:**

| Action | Purpose |
|---|---|
| `openCampaignStudio(phase?)` | Opens the modal at the specified phase. Phase 1 resets the campaign; Phase 3 keeps the existing one. |
| `closeCampaignStudio()` | Closes the modal. |
| `setCampaignPhase(phase)` | Changes the phase within the open modal. |
| `setCampaignShortlink(slug)` | Stores the shortlink + creates a campaign ID if none exists. |
| `saveCampaignPage(content)` | Stores the page editor content. |
| `setCampaignFunnel(data)` | Stores the funnel metrics from the conversion API. |
| `hasActiveCampaign()` | Returns `true` if `activeCampaign.id !== null`. Used to toggle [Build Campaign] → [Monitor Campaign]. |

### The "Edit vs. Monitor" State Logic

The CampaignStudio respects the lifecycle state:

- **No active campaign** (`id === null`): Opens at Phase 1 (Link Creation). The [Build Campaign] button shows on B10.
- **Active campaign** (`id !== null`): Opens at Phase 3 (Funnel Monitoring). The button changes to [Monitor Campaign] on B10. The user can navigate back to Phase 2 to edit the page.

This is enforced in `B10 FactLibrary`:
```typescript
const handleCampaignAction = () => {
  if (hasActiveCampaign) {
    openCampaignStudio(3) // Monitor existing
  } else {
    openCampaignStudio(1) // Create new
  }
}
```

And in `B08 CommandCenter`:
```typescript
onCreatePromo={() => openCampaignStudio(hasActiveCampaign ? 3 : 1)}
```

### External Repository Integrations

#### 1. Page Editor — Chai Builder / Plasmic (Embedded SDK)

**Target repos:**
- Chai Builder: `github.com/chaibuilder/sdk` — Tailwind-native visual builder
- Plasmic: `github.com/plasmicapp/plasmic` — Headless visual page builder

**Integration point:** `PageBuilderHost` component in `campaign-studio.tsx`

For V1, the right side of the Phase 2 split-screen renders a `MockPhonePreview` — a mock iPhone frame that live-updates as the user types. The `PageBuilderHost` component wraps this mock and is the designated swap point:

```tsx
// V1 (current): Mock phone preview
<PageBuilderHost headline={headline} subhead={subhead} ... />

// V2 (integration): Replace with Chai Builder iframe
<iframe src={`https://editor.chaibuilder.com/embed/${campaignId}`} className="w-full h-full" />

// Or Plasmic component
<PlasmicComponent component="CampaignPage" props={{ headline, subhead, ctaText }} />
```

The `PageBuilderHost` is tagged with a "SDK READY · iframe host" badge so engineers know it's the integration point.

#### 2. Conversion Engine — TastyIgniter Webhooks

**Target repo:** `github.com/tastyigniter/TastyIgniter` — Open-source restaurant ordering system

**Data flow:**
```
TastyIgniter (order placed)
  → POST /api/webhooks/tastyigniter/cta (CtaClickEvent)
  → POST /api/webhooks/tastyigniter/order (TastyIgniterOrder)
  → NestJS stores in PostgreSQL
  → GET /api/conversion/stats/:brandId
  → CampaignStudio Phase 3 fetches + displays
```

**Phase 3 data source:** `conversionApi.getStats(brandId)` calls `GET /api/conversion/stats/:brandId`, which returns:
```json
{
  "totalClicks": 1240,
  "totalOrders": 45,
  "conversionRate": 3.6,
  "attributedRevenueCents": 135000,
  "attributedRevenueUsd": 1350.00
}
```

The Phase 3 component calls this on mount and stores the result via `setCampaignFunnel()`.

### Global Access Points

| Screen | Button | Action |
|---|---|---|
| B08 Command Center | [View Campaigns] (toolbar) | `openCampaignStudio(3)` — always opens at Phase 3 |
| B08 Command Center | [Create New Promo Cycle →] (bottom CTA) | `openCampaignStudio(hasActiveCampaign ? 3 : 1)` |
| B10 Fact Library | [🚀 Build Campaign] (no active campaign) | `openCampaignStudio(1)` — starts at Link Creation |
| B10 Fact Library | [📊 Monitor Campaign] (active campaign exists) | `openCampaignStudio(3)` — jumps to Funnel Monitoring |
| A08 Lead Magnet | Total Clicks card (clickable) | `openCampaignStudio(3)` |
| A08 Lead Magnet | Attributed Revenue card (clickable) | `openCampaignStudio(3)` |
| AI Copilot pill | "Launch Campaign" suggestion | `openCampaignStudio(3)` |

### The Copy Link Micro-Interaction

When the user clicks [Copy Link] in Phase 1:
1. `setCampaignShortlink(linkCode)` updates the Zustand store
2. The button morphs from "Copy Link" → "✓ Copied" (springSnappy scale pop)
3. 8-particle mini confetti burst fires from the button
4. A confirmation line appears: "✓ Active campaign shortlink: pero.to/spicy-chicken"

### The Save Page Flow

When the user clicks [Save Page] in Phase 2:
1. `saveCampaignPage({ headline, subhead, ctaText, socialProof })` updates the Zustand store
2. The button shows "✓ Saved to campaign" for 2s
3. In production (V2), this would also POST the page content to the Plasmic/Chai Builder API
4. The user can then proceed to Phase 3 (View ROI Funnel)

---

## COMPONENT UPDATES (V2)

| Component | File | Change |
|---|---|---|
| CampaignStudio | `src/components/perokio/campaign/campaign-studio.tsx` | Now reads `campaignPhase` from Zustand (not local state). Phase 3 fetches live data from `conversionApi.getStats()`. Phase 2 has `PageBuilderHost` (iframe-ready container). |
| CommandCenterToolbar | `src/components/perokio/campaign/command-center-toolbar.tsx` | Added `onViewCampaigns` prop + [View Campaigns] button. |
| B10 Fact Library | `src/components/perokio/brand/fact-library.tsx` | [Build Campaign] / [Monitor Campaign] button — toggles based on `hasActiveCampaign`. |
| A08 Lead Magnet | `src/components/perokio/admin/lead-magnet.tsx` | Total Clicks + Attributed Revenue cards are now clickable → `openCampaignStudio(3)`. |
| Zustand Store | `src/store/perokio.ts` | Added `activeCampaign` state + 7 campaign actions (`openCampaignStudio`, `closeCampaignStudio`, `setCampaignPhase`, `setCampaignShortlink`, `saveCampaignPage`, `setCampaignFunnel`, `hasActiveCampaign`). |

---

## NEW DESIGN TOKENS (V2)

No new design tokens were added. The Campaign & Link Engine uses the existing locked tokens:
- Lime #D8EF70 for primary campaign CTAs
- Orange #ED7A42 for A/B testing variant B
- Teal #6FD3C7 for conversion rate
- Violet #B6A6FF for Magic Write AI suggestions
- The `glass-premium` class for Campaign Studio containers
- The `skeleton-premium` class for AI loading states

---

## EMBEDDED PAGE EDITOR (CHAI BUILDER)

### SDK Integration

**Package:** `@chaibuilder/sdk` v4.0.0-beta.51 (github.com/chaibuilder/sdk)
**Integration point:** `src/components/perokio/campaign/page-builder-host.tsx`

The `PageBuilderHost` component wraps the Chai Builder `ChaiBuilderEditor` and provides:

1. **Dynamic loading** via `next/dynamic` — the SDK is 377 packages heavy. Loading it lazily prevents bundle bloat. The editor only loads when the Campaign Studio Phase 2 is opened.

2. **Template selection** — 3 pre-built QSR campaign templates (Lunch Special, New Product Launch, Weekend Promo) are available as selectable tabs above the editor. Each template provides an `initialBlocks` array.

3. **Custom block registration** — 3 Perokio-specific blocks are registered via `registerChaiLibrary()`:
   - `TastyIgniterMenuBlock` — fetches and renders TastyIgniter menu items (mock in V1, headless API in V2)
   - `SparkCTA` — a lime/orange button that links to a `pero.to/` shortlink
   - `CountdownTimer` — urgency timer with 3 variants (urgent=red, launch=lime, standard=orange)

4. **AI assistant** — the `askAiCallBack` prop is wired. V1 returns mock suggestions. V2 will call OpenRouter API (`NEXT_PUBLIC_OPENROUTER_API_KEY`) with `anthropic/claude-3.5-sonnet`.

5. **Graceful fallback** — if the SDK fails to load (network error, version conflict), the component falls back to the `MockPhonePreview` — a live-updating iPhone mock that mirrors the editor state.

### Files

| File | Purpose |
|---|---|
| `src/components/perokio/campaign/page-builder-host.tsx` | The wrapper component. Dynamically imports `ChaiBuilderEditor`, registers blocks, provides template selector, handles save callback. Falls back to mock preview on error. |
| `src/lib/perokio/campaign-templates.ts` | 3 pre-built template definitions (Lunch Special, New Product Launch, Weekend Promo). Each template has a `blocks` array in ChaiBlock format. |
| `src/lib/perokio/chai-blocks.tsx` | 3 custom block definitions (TastyIgniterMenuBlock, SparkCTA, CountdownTimer) + `registerPerokioBlocks()` function that calls `registerChaiLibrary()`. |

### onSave Flow

When the user clicks [Save Page] in Phase 2:
1. The `ChaiBuilderEditor` calls `onSave({ blocks, autoSave })`
2. `PageBuilderHost.handleSave()` stores the block tree
3. The `onSave` prop callback fires — CampaignStudio stores it via `saveCampaignPage()`
4. In V2, this will also `POST` the block tree to the NestJS backend for persistence

### Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_OPENROUTER_API_KEY` | The API key for the Chai Builder AI assistant. Billed to Perokio's account. |
| `NEXT_PUBLIC_CHAI_BUILDER_LICENSE` | (Optional) Chai Builder Pro license key for removing watermarks. |
