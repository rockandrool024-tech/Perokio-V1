# 🦜 PEROKIO: The Revenue OS for MENA Brands

---

## Slide 1: Title

# Perokio
## The Revenue Operating System for MENA Restaurant Brands

**Verified Facts × Local Film × Tracked Revenue**

*Pre-Seed Round — November 2026*

---

## Slide 2: The Problem

### MENA restaurant brands are bleeding money on marketing that doesn't convert.

| Pain Point | Cost |
|---|---|
| **Agencies are too slow & expensive** | $3,000–$10,000/mo for 4-8 pieces of content. 2-week turnaround. No ROI data. |
| **AI hallucinates** | Brands are terrified of AI-generated claims. One false health statement = lawsuit + platform ban. |
| **Zero ROI tracking** | Brands spend on "brand awareness" content and have **no idea** if it drove a single order. |
| **Creator content is off-brand** | Influencers improvise. Scripts get ignored. Legal exposure with every post. |

**The result:** QSR chains either overpay agencies for untraceable content, or underinvest in social and lose market share to digitally-native competitors.

---

## Slide 3: The Solution

### Perokio is a Revenue OS — not a content tool.

**1. Verified Fact Bundles**
Brands submit claims → our Studio team verifies every line against official sources → creators film exactly what's written. **Zero hallucination. Zero legal risk.**

**2. Campaign Studio (The $499 Feature)**
A 3-phase wizard: generate a trackable `pero.to/` smart link → build a conversion page with AI → watch the revenue waterfall (Views → Clicks → Orders → Revenue) in real-time.

**3. Double-Entry Ledger**
Every dollar is accounted for. Brand escrow → creator pending → withdrawable. Bank-grade financial infrastructure. Built-in.

**4. The Weekly Promo Cycle**
Every Monday at 9am, next week's content locks. Brands operate on a rhythm — not on ad-hoc chaos.

---

## Slide 4: The Moat

### The B11 Script-Locking Engine

**Our defensible advantage is not the AI — it's the GUARDRAIL around the AI.**

```
┌─────────────────────────────────────────────────────┐
│  B11 VERIFICATION GATE                              │
│                                                     │
│  Every script line MUST link to a verified source.  │
│  If ANY line is unverified →                        │
│  the publish button is PHYSICALLY DISABLED.         │
│                                                     │
│  Enforced at:                                       │
│  1. Application layer (400 B11_VERIFICATION_FAILED) │
│  2. Database layer (raw SQL guard)                  │
│  3. UI layer (opacity-50, cursor-not-allowed)       │
│                                                     │
│  Proof: SHA-256 VerificationReceipt on approval     │
└─────────────────────────────────────────────────────┘
```

**What this means for the brand:**
- They can PROVE every claim in their video is sourced
- Legal teams love us
- No competitor in MENA has this

**What this means for the investor:**
- Our moat is a technical + legal architecture, not just a UI feature
- Replicating it requires rebuilding the entire verification pipeline
- It compounds: every approved script generates a tamper-evident receipt

---

## Slide 5: How It Works

### The Weekly Promo Cycle — The $100M Flywheel

```
  1. SCAN MARKET (AI)
     ↓ AI Copilot: "🔥 #IcedCoffee is exploding (+380/h)"
     ↓
  2. GENERATE ASSETS
     ↓ RAG pipeline + BrandContext → verified scripts
     ↓
  3. BUILD CAMPAIGN
     ↓ Smart Link (pero.to/) + Page Editor + A/B Testing
     ↓
  4. APPROVE (B11 Gate)
     ↓ SHA-256 rubber stamp → Certificate of Verification
     ↓
  5. DISTRIBUTE (Creators)
     ↓ Claim → Film 20s → Lock → Brand approves → Publish
     ↓
  6. MONITOR REVENUE (TastyIgniter)
     ↓ Views → Clicks → Page Views → Orders → Revenue
     ↓
  7. AI OPTIMIZATION
     ↓ "⚠️ CPM up 15%. Boost Amira's Spark."
     ↓
  8. REPEAT — COMPOUNDING ROI
```

**The "Aha!" moment:** The exact second a brand sees a dollar amount roll up next to a Spark they approved 24 hours ago.

---

## Slide 6: The Target Market

### MENA QSR & Fast-Casual Chains

| Market | Size | Details |
|---|---|---|
| **TAM** | $4.2B | MENA F&B digital marketing spend (2026 est.) |
| **SAM** | $180M | Tunisia + Gulf QSR chains (multi-location, digitally-native) |
| **SOM** | $6M | First 100 chains × $499/mo × 12 months |

**Why now:**
- MENA food delivery grew 300% since 2020 (Talabat, Jahez, Careem)
- TikTok is the #1 discovery channel for restaurants in Tunisia/Saudi/Egypt
- No competitor has combined verified AI content + creator distribution + order tracking
- TastyIgniter (open-source restaurant OS) has 10,000+ installations globally

**Beachhead:** Tunisia (low competition, French/Arabic bilingual market, easy regulatory environment for pilot)

---

## Slide 7: Business Model

### $499/month SaaS + Variable Revenue Streams

**Fixed Revenue — $499/mo per brand:**
- 60 Verified Fact Bundles per month
- 4 Spark campaigns (boosted creator videos)
- Full Campaign Studio access (Smart Links + Page Editor + ROI Funnel)
- B11 Verification Engine + SHA-256 receipts
- TastyIgniter integration + order tracking

**Variable Revenue — The Wallet:**
- Brands top up their escrow wallet (Stripe)
- Base Fees ($2-$80 per claim) + CPM ($3 per 1,000 views) paid to creators
- **25% royalty** when a brand licenses a creator's video for Spark ads

**Unit Economics:**
| Metric | Value |
|---|---|
| CAC | ~$800 (direct sales + in-person) |
| LTV | $17,964 ($499 × 36 months avg) |
| Gross Margin | 82% |
| LTV:CAC | 22:1 |
| Payback Period | 1.6 months |

**Path to $10M ARR:** 1,667 brands × $499/mo. Achievable at 5% penetration of the Gulf QSR market alone.

---

## Slide 8: Traction

### Built V1 in 9 weeks. Zero outsourced development.

**Technical achievements:**

| Metric | Value |
|---|---|
| Screens built | 44+ across Brand / Creator / Admin / Studio |
| Backend API routes | 39 (NestJS + Prisma + BullMQ) |
| Database tables | 27 (PostgreSQL, double-entry ledger) |
| Proof scripts/tests | 9 — all passing |
| AI pipeline | RAG with BrandContext, hallucination detection |
| External integrations | TastyIgniter (webhooks), OpenRouter (Claude 3.5), Postiz |

**What we've proven:**
- ✅ B11 Gate physically blocks unverified publishing (verified in live API)
- ✅ Double-entry ledger balances perfectly (debits === credits, idempotent webhooks)
- ✅ Race-condition-safe state machines (BullMQ conditional SQL updates)
- ✅ RAG pipeline retrieves BrandContext + rejects hallucinated source_ids
- ✅ Campaign Studio 3-phase flow works end-to-end (Smart Link → Page Editor → Revenue Funnel)
- ✅ Media Calendar with Month/Week/Day views + drag-and-drop + inline metrics

**What we haven't done yet:** First paying customer. This is why we're raising.

---

## Slide 9: The Ask

### $500,000 Pre-Seed

**Use of funds:**

| Allocation | Amount | Purpose |
|---|---|---|
| Tunisia Pilot | $200,000 | 5 QSR chains × 6 months. Content operations, creator payouts, success team. |
| Engineering | $150,000 | 2 engineers × 12 months. Polish V1 → V2. Ship the Chai Builder iframe integration. |
| Sales & Marketing | $100,000 | 2 sales reps × 6 months. Direct outreach to 100 Tunisian QSR chains. |
| Legal & Admin | $50,000 | Company formation, IP protection for B11 engine, accounting. |

**Milestones this unlocks:**
- Month 3: 5 paying pilot brands ($2,495 MRR)
- Month 6: 20 brands ($9,980 MRR) — break-even on fixed costs
- Month 12: 50 brands ($24,950 MRR) + $50K in Spark royalties → ready for Seed round

**We're not raising to figure out product-market fit. We're raising to prove it at scale.**

---

## Slide 10: Vision

### The $100M Marketing Command Center for every restaurant in MENA.

**Year 1:** Dominate Tunisia. 50 chains. $300K ARR. Become the default tool for Tunisian QSR.

**Year 2:** Expand to Saudi Arabia + Egypt. 500 chains. $3M ARR. Partner with Jahez + Talabat.

**Year 3:** Gulf-wide. 2,000 chains. $12M ARR. Launch the Perokio Creator Marketplace (10,000+ vetted creators).

**Year 5:** $100M ARR. The operating system that every restaurant in MENA uses to plan, produce, distribute, and track their marketing. The B11 engine becomes the industry standard for verified content.

---

*Perokio — Verified Facts × Local Film × Tracked Revenue*

*Contact: founders@perokio.com*
