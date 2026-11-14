# 🦜 PEROKIO — Product Core (V1 Technical Summary)

---

## The B11 Moat: Script-Locking Engine

### How It Works

The B11 Engine is Perokio's core defensible advantage. It physically prevents AI hallucination by requiring every script line to be linked to a verified source before publishing is possible.

**The 3-layer enforcement:**

```
┌────────────────────────────────────────────────────────────┐
│  LAYER 1: Application (NestJS)                             │
│  POST /api/scripts/:id/approve                             │
│  → Queries all ScriptLine records                          │
│  → If ANY line has verified = false                        │
│  → Returns 400 B11_VERIFICATION_FAILED                     │
│  → Lists the offending lineIds + texts                     │
├────────────────────────────────────────────────────────────┤
│  LAYER 2: Database (PostgreSQL)                            │
│  Raw SQL guard:                                            │
│  SELECT COUNT(*) FROM "ScriptLine"                         │
│  WHERE scriptVersionId = ? AND verified = false            │
│  → Even if app layer is bypassed, DB refuses               │
├────────────────────────────────────────────────────────────┤
│  LAYER 3: Frontend (Next.js)                               │
│  B11ApproveButton component:                               │
│  → disabled when unverified                                │
│  → CSS: opacity-50, cursor-not-allowed, grayscale(40%)     │
│  → Tooltip: "N sources missing. B11 Gate locked."         │
└────────────────────────────────────────────────────────────┘
```

**The VerificationReceipt:**
- On successful approval, a SHA-256 hash is generated
- The hash covers: `{scriptVersionId, lines: [{position, text, sources}], reviewerId, approvedAt}`
- Stored in the `VerificationReceipt` table
- If ANY line is edited after approval → `invalidatedAt` is set → the receipt is void
- The receipt is the tamper-evident proof that the script was 100% sourced at approval time

**The Off-Script Defense:**
- When a creator uploads a video transcript, it's compared against the approved script
- Jaccard similarity < 0.7 → `held_factual_deviation` state
- The brand can override (assuming legal risk) → the original VerificationReceipt is invalidated
- Every override is logged as a `PolicyCheck {result: 'override'}`

**Proof:** `backend/scripts/proof-b11-gate.sh` demonstrates the gate blocking approval with 400, then succeeding with 201 + SHA-256 hash after all lines are verified.

---

## The Campaign Studio: 3-Phase Flow

### Phase 1: Smart Link & Routing Hub

- `pero.to/` slug input with copy-to-clipboard + confetti micro-interaction
- A/B Testing: up to 4 destination URLs with auto-calculated weight sliders
- Traffic splits 50/50 (or custom) between TastyIgniter menu, WhatsApp order link, etc.
- Shortlink stored in Zustand `activeCampaign.shortlink`

### Phase 2: Conversion Canvas (Page Editor)

- Split-screen: Left = editor, Right = live mobile preview (iPhone 15 Pro mock)
- 3 pre-built QSR templates: Lunch Special, New Product Launch, Weekend Promo
- AI Magic Write: generates 3 headline suggestions via OpenRouter (Claude 3.5 Sonnet)
- Blocks: Hero Image, Headline, Sub-headline, Social Proof, CTA Button
- Custom blocks: TastyIgniterMenuBlock, SparkCTA, CountdownTimer
- Preview updates with spring physics as user types
- [Save Page] stores content in Zustand `activeCampaign.pageContent`

### Phase 3: ROI Command Center (Funnel Monitoring)

- **Revenue Waterfall:** Views (10k) → Clicks (1.2k) → Page Views (1k) → Orders (45)
- Each stage animated with CountUp + dropoff percentage
- **Revenue Chart:** 7-day area chart (Recharts) with lime gradient
- **Attribution Leaderboard:** Ranked creators by revenue (avatar, orders, % share, revenue bar)
- **Loop CTA:** [Launch Next Campaign →] glowing lime button (appears after 2s delay)
- Data source: `GET /api/conversion/stats/:brandId` (fed by TastyIgniter webhooks)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + TypeScript 5 | Premium UI, SSR for public pages, fast HMR |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Dark glassmorphism design system, locked tokens |
| **Animation** | Framer Motion 12 | Spring physics (`springSoft`, `springSnappy`) |
| **Charts** | Recharts | Revenue waterfall, area charts, attribution bars |
| **State** | Zustand (5 stores) | Main store, auth, live data, growth, onboarding |
| **Backend** | NestJS 10 (Modular Monolith) | Clean architecture, dependency injection, guards |
| **ORM** | Prisma 6 + PostgreSQL 17 | Type-safe queries, 27 tables, native arrays |
| **Queue** | Redis 7 + BullMQ 5 | Delayed jobs: 24h claim expiry, 12h review, 24h settlement |
| **Object Storage** | Cloudflare R2 | Video MP4 storage, zero egress fees |
| **AI (Generation)** | OpenRouter → Claude 3.5 Sonnet | Script generation via RAG pipeline |
| **AI (Chat)** | OpenRouter → Claude 3.5 Sonnet | Campaign page editing via natural language |
| **Page Editor** | Chai Builder SDK (V2: iframe) | Visual drag-and-drop page builder |
| **Restaurant OS** | TastyIgniter (webhooks) | Order tracking: CtaClickEvent + TastyIgniterOrder |
| **Social Publishing** | Postiz (REST API) | Distribute to TikTok/Instagram/YouTube |
| **Payments** | Stripe (brands) + Flouci (creators) | Wallet top-ups + TND payouts |
| **Auth** | JWT + Passport | 8-role RBAC, access/refresh tokens |

---

## The AI Guardrails

### RAG Pipeline (Brand-Aware AI)

When `POST /api/facts/:id/generate` is called:

1. **Retrieve** the brand's context:
   - `Fact.rawClaim` — the brand's original unverified claim text
   - `Fact.verifiedSources` — the list of approved source URLs
   - `BrandContext` — industry, target audience, brand voice, guidelines
   - `BrandAssets` — tagged tone guides

2. **Augment** the prompt with a strict system instruction:
   ```
   STRICT RULES:
   1. You MUST ground every factual line in one of the verified sources.
   2. For each line, set "suggestedSourceId" to the source_id that backs the claim.
   3. If a line is a CTA, set "suggestedSourceId" to null.
   4. You MUST NOT invent new claims or sources.
   5. Match the brand voice and target audience exactly.
   ```

3. **Generate** via OpenRouter (Claude 3.5 Sonnet)

4. **Validate** the response:
   - If any `suggestedSourceId` is NOT in `Fact.verifiedSources` → **400 HALLUCINATION_DETECTED**
   - The invalid line IDs are returned with the error
   - The generation run is marked as `failed`
   - No script is saved

5. **Human review:** Even after AI passes validation, all lines are created with `verified = false`. Only a human QA reviewer can verify each line via `POST /admin/lines/:id/verify`.

### The Eval Gate

Before a HarnessConfig (LLM configuration) can be activated, it must pass a hallucination eval:
- 3 trap prompts (fake medical claim, fake regulatory claim, fake outcome promise)
- If the LLM tries to verify any of them → eval fails → activation blocked
- This ensures the AI model being used doesn't hallucinate on our platform

**Proof:** `backend/scripts/proof-rag-pipeline.sh` shows the RAG context being assembled, the LLM suggesting source_ids, and all lines being pre-linked with `verified=false`.

---

## Infrastructure Highlights

### Race-Condition Safety
All state transitions use conditional SQL updates:
```sql
UPDATE "Claim" SET status = 'locked'
WHERE id = ? AND status IN ('claimed', 'in_edit')
RETURNING id
-- If 0 rows returned, the timer or another request already moved it
```
**Proof:** `backend/test/race-condition.test.ts` fires `lock()` and `expire()` simultaneously — exactly one wins.

### Double-Entry Ledger
Every money movement creates paired debit + credit entries:
- Top-up: Debit brand_escrow, Credit stripe_pending
- Settlement: Debit creator_pending, Credit brand_escrow
- Payout: Debit creator_withdrawable, Credit creator_pending
- `idempotencyKey` unique constraint prevents duplicate Stripe webhook entries

**Proof:** `backend/test/distribution-ledger.test.ts` shows debits === credits ($566.40 === $566.40) after top-up + settlement + payout.

### Anomaly Detection
ViewSnapshots with >200% view growth are flagged `isAnomalous = true` with `anomalyFlags = ["velocity_spike"]`. The settlement worker refuses to settle anomalous videos. Admin must manually dismiss the anomaly.

### BullMQ Workers
- `lock-expiry`: 24h timer — auto-expires claims (conditional SQL, race-safe)
- `review-expiry`: 12h timer — auto-approves or holds based on brand settings
- `settle-video`: 24h timer — calculates payout + calls `LedgerService.settleFunds()`

---

## V1 Stats

| Metric | Value |
|---|---|
| Frontend screens | 44+ (Brand B01-B20, Creator C01-C07, Admin A01-A08, Public P01-P04) |
| Backend API routes | 39 |
| Database tables | 27 |
| BullMQ workers | 3 |
| Proof scripts | 9 (all passing) |
| Zustand stores | 5 |
| Shared components | 16 |
| Design tokens | Locked (6 colors, 3 fonts, 3 spring curves, 5 glass types) |
| i18n | EN/AR with full RTL support |
| Lines of code | ~28,000 (frontend) + ~12,000 (backend) |
