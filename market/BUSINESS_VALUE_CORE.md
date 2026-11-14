# 🦜 PEROKIO — Business Value Core & Unit Economics

---

## The $499/Month Model

### What the Brand Gets

| Feature | Volume/Month | Value |
|---|---|---|
| **Verified Fact Bundles** | 60 (15/week) | Each bundle = a verified claim + B11-locked script + provided assets |
| **Spark Campaigns** | 4 (1/week) | Boosted creator videos distributed to the Creator Wall |
| **Campaign Studio Access** | Unlimited | Smart Link generator + Page Editor + ROI Funnel |
| **B11 Verification Engine** | All facts | SHA-256 receipts, line-level source locking |
| **TastyIgniter Integration** | Full | Order tracking webhooks → Revenue attribution |
| **Media Calendar** | Full | Month/Week/Day views, drag-and-drop scheduling |
| **AI Copilot** | 24/7 | Next-best-action recommendations, trend alerts |
| **Creator Marketplace Access** | 10 creators/fact | Pre-vetted, reliability-scored, paid via escrow |

### Why $499 is Underpriced

| Alternative | Monthly Cost | What You Get |
|---|---|---|
| Traditional agency (Tunisia) | $2,000-$5,000 | 4-8 content pieces, no scripts, no tracking, 2-week turnaround |
| UGC platform (Billo) | $1,500+ | Generic creator videos, no verification, no ROI tracking |
| AI copywriting (Jasper) | $99 | Text only — no distribution, no creators, no tracking |
| In-house content team | $3,000+ | 1 person, inconsistent quality, no infrastructure |
| **Perokio** | **$499** | **60 verified facts + 4 Spark campaigns + Campaign Studio + full ROI tracking + AI Copilot** |

**The brand saves $1,500-$4,500/mo AND gets infrastructure they can't build in-house.**

---

## The Variable Wallet

### How Brands Fund Creator Payouts

The $499/mo subscription covers the platform. Creator payouts are funded separately via the brand's wallet:

**Flow:**
```
1. Brand tops up wallet via Stripe ($500, $1,000, etc.)
   → Debit brand_escrow, Credit stripe_pending

2. Creator claims a Fact Bundle
   → Base Fee is escrowed (e.g., $8)
   → CPM budget is allocated (e.g., $30 cap)

3. Creator films + locks the video
   → Brand has 12h to review

4. Video is published → 24h view window
   → Views are counted (via TastyIgniter + platform APIs)

5. Settlement (after 24h)
   → Debit brand_escrow, Credit creator_pending
   → Amount = Base Fee + (Views / 1000) × $3 CPM
   → Capped at $30 CPM per video

6. Creator withdraws via Flouci
   → Finance admin approves
   → Debit creator_pending, Credit creator_withdrawable
   → Money hits the creator's bank account in 24h
```

**Example: A single video's economics**
| Line Item | Amount |
|---|---|
| Brand's escrow cost | $8.00 (base) + $25.20 (CPM for 8,400 views) = $33.20 |
| Creator receives | $33.20 |
| Perokio's margin | Covered by the $499/mo subscription |
| Spark Boost (if brand licenses) | +$25% royalty to Perokio |

---

## The 25% Royalty Loop

### How Perokio Takes a Cut on Spark Ads

**What is a Spark?** A Spark is when a brand takes a creator's video and licenses it for paid distribution (TikTok Spark Ads, Instagram Boost).

**How it works:**
1. Creator films a video for a Fact Bundle → gets paid Base + CPM
2. The video performs well (e.g., 8.4k views, 1,200 clicks, 45 orders)
3. Brand wants to run it as a Spark Ad to amplify reach
4. Brand clicks [Boost] on the B08 Command Center → B17 Results screen
5. Brand licenses the video for a Spark Ad → pays a licensing fee (e.g., $50-$200)
6. **Perokio takes 25% of the licensing fee**
7. Creator receives 75% — passive income from content they already made

**Why creators love it:** They get paid AGAIN for content they already created. This is the "Cash App loop" — fast, rewarding, and compounding.

**Why brands love it:** They're licensing PROVEN content (they can see the ROI metrics before deciding to boost). No risk on untested creative.

**Revenue impact:** If 30% of brands run 2 Spark Ads/month at $100 average licensing:
- 100 brands × 30% × 2 Spark Ads × $100 × 25% = **$1,500/mo in royalty revenue**
- At 1,000 brands: **$15,000/mo** = $180K ARR in royalties alone

---

## Unit Economics

### The Numbers That Matter

| Metric | Value | Calculation |
|---|---|---|
| **ARPA** (Avg Revenue Per Account) | $549/mo | $499 subscription + $50 avg wallet fees |
| **CAC** (Customer Acquisition Cost) | $800 | Direct sales (2 reps × $3K/mo ÷ 8 closed deals/mo) |
| **LTV** (Lifetime Value) | $17,964 | $499/mo × 36 months avg retention |
| **Gross Margin** | 82% | Revenue minus creator payouts + infra (R2, Redis, Postgres) |
| **LTV:CAC Ratio** | 22:1 | Exceptional — SaaS benchmark is 3:1 |
| **Payback Period** | 1.6 months | $800 CAC ÷ $499 MRR |
| **Net Revenue Retention** | 115% | Brands upgrade tiers + increase wallet spend |
| **Logo Churn** | 3%/mo | Based on comparable B2B SaaS at this price point |

### Path to $10M ARR

| Year | Brands | MRR | ARR | Milestone |
|---|---|---|---|---|
| Year 1 | 50 | $24,950 | $299,400 | Tunisia dominance |
| Year 2 | 250 | $124,750 | $1,497,000 | Saudi + Egypt expansion |
| Year 3 | 700 | $349,300 | $4,191,600 | Gulf-wide + marketplace launch |
| Year 4 | 1,300 | $648,700 | $7,784,400 | Perokio Creator Marketplace (10K creators) |
| Year 5 | 1,900 | $948,100 | $11,377,200 | **$10M+ ARR** + Series B |

**Spark Royalty Revenue (additive):**
| Year | Spark Revenue | Total ARR |
|---|---|---|
| Year 2 | $180,000 | $1.68M |
| Year 3 | $540,000 | $4.73M |
| Year 5 | $1,540,000 | **$12.9M** |

### The 80%+ Gross Margin Explained

| Cost Item | % of Revenue | Notes |
|---|---|---|
| Creator payouts | 12% | Funded by brand wallet (not subscription revenue) |
| Infrastructure (R2, Redis, Postgres, VPS) | 3% | ~$1,500/mo at 100 brands |
| AI costs (OpenRouter) | 2% | ~$1,000/mo at 100 brands (Claude 3.5 Sonnet) |
| Payment processing (Stripe) | 1% | 2.9% on wallet top-ups only |
| **Gross Margin** | **82%** | Extremely healthy for a SaaS at this stage |

---

## Why This Is a Venture-Scale Business

1. **Recurring revenue:** $499/mo subscription = predictable MRR
2. **Marketplace dynamics:** More brands → more creators → more content → better AI → more brands
3. **Network effects:** The B11 verification library compounds (every verified fact is a reusable asset)
4. **Data moat:** Every order tracked via TastyIgniter improves our AI Copilot recommendations
5. **Expandable ACV:** Brands start at $499, then increase wallet spend + Spark licensing
6. **Geographic expansion:** Tunisia → Saudi → Egypt → UAE → full MENA. Same product, new market.

**Perokio is not a content tool. It's a Revenue Operating System with a defensible moat, 82% margins, and a 22:1 LTV:CAC ratio.**
