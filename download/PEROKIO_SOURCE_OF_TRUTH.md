# 🦜 PEROKIO — PRODUCT SOURCE OF TRUTH (V1, Post-Cycle 8)

> **Status:** V1 Locked. All 8 build cycles complete. 44+ screens across 3 roles.
> **Stack:** Next.js 16 (App Router) · TypeScript 5 · Tailwind CSS 4 · Zustand · Framer Motion · Recharts · shadcn/ui
> **Last updated:** November 2024 (post-Cycle 8)

---

## 1. EXECUTIVE SUMMARY

Perokio is a two-sided, agent-mediated marketplace for the MENA creator economy. Brands fund **Verified Fact Bundles** (a verified claim + a B11-locked script + provided assets). Creators claim facts, film 20-second videos using the in-browser Hyperframe editor, and earn via a **Base Fee + CPM model**.

The moat is **B11 Script Review**: line-level source locking that physically prevents AI hallucination. Every script line must link to a verified source. If any line is unverified, the publish button is disabled. No exceptions.

### What's built (Cycles 1-8)

| Category | Screens | Status |
|---|---|---|
| **Brand Studio** (B01-B20) | 20 screens | ✓ Complete |
| **Creator App** (C01-C08 + U01 + WL01) | 10 screens | ✓ Complete |
| **Admin Cockpit** (A01-A07) | 7 screens + Cmd+K | ✓ Complete |
| **Public Surfaces** (P01-P04) | 4 routes + OG cards | ✓ Complete |
| **Onboarding Wizard** (B01-B07) | 7-step flow | ✓ Complete |
| **Viral Engine** | ShareModal, growth store, watermark, referrals | ✓ Complete |
| **Total unique screens** | 44+ | |

---

## 2. DESIGN SYSTEM (LOCKED)

### Colors
- **Background:** `#0A0F0D` (Deep Dark, always-on, no light mode)
- **Primary/Lime:** `#D8EF70` (Signal Lime — verified, success, primary CTAs)
- **Orange:** `#ED7A42` (Opportunity Orange — urgent, opportunity, warnings)
- **Red:** `#E5484D` (Alert Red — destructive, blocked, critical)
- **Teal:** `#6FD3C7` (Cool Teal — tertiary accent)
- **Violet:** `#B6A6FF` (Soft Violet — Elite/premium accent)

### Typography
- **Fraunces** (serif) — headings, question text, section titles
- **Inter** (sans-serif) — UI body, labels, navigation
- **JetBrains Mono** — numbers, timers, codes, monetary values (`class="font-mono" data-mono`)

### Glassmorphism
```css
.glass          { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(20px); }
.glass-strong   { background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(28px); }
.glass-lime     { background: linear-gradient(135deg, rgba(216,239,112,0.10), rgba(216,239,112,0.02)); border: 1px solid rgba(216,239,112,0.25); }
.glass-orange   { background: linear-gradient(135deg, rgba(237,122,66,0.10), rgba(237,122,66,0.02)); border: 1px solid rgba(237,122,66,0.25); }
.glass-red      { background: linear-gradient(135deg, rgba(229,72,77,0.10), rgba(229,72,77,0.02)); border: 1px solid rgba(229,72,77,0.30); }
```

### Radii
- Control: 14px · Card: 20px · Hero: 26px · Pill: 999px

### Motion System (`src/lib/perokio/motion.ts`)
- `springSoft`: stiffness 120, damping 20 (state changes)
- `springSnappy`: stiffness 300, damping 25 (microinteractions)
- `easeEditorial`: cubic-bezier(0.22, 0.61, 0.36, 1) (entrances)
- Elevation tokens: `shadow-glass`, `shadow-lime-glow`, `shadow-orange-glow`

### Accessibility
- `prefers-reduced-motion`: checked in 13 component files via `useReducedMotion()` hook. Disables all decorative animations (blink, ticker, pulse, gradient drift).
- CSS `@media (prefers-reduced-motion: reduce)` block in `globals.css` kills all animation loops globally.

---

## 3. THE MOAT — B11 SCRIPT-LOCKING ENGINE

**The locked logic (non-negotiable):**
- B11 Script Review physically disables the publish button when ANY line is unverified.
- Every script line shows its source tag (e.g., "Fact #TUN-0412").
- Verified lines: green 🔒 icon + source chip.
- Unverified lines: red ⚠️ icon + "Link source" dropdown.
- The button text changes: "Approve & publish to Wall" (verified) → "Locked — finish verification" (unverified).
- `approveScriptLine(factId, lineId, sourceId)` is the only way to verify a line.

**Files:** `src/components/perokio/brand/script-review.tsx` (B11)

---

## 4. THE E2E FLOW (LOCKED CONTRACT)

```
Studio authors fact (A07)
  → Sources attached to every script line
  → B11 verifies → publishes to Facts Wall
Creator claims fact (C01)
  → Auto-advance to C03 (Claim Confirmation, ParrotEye claim state)
  → "Go to editor" → C04 (Hyperframe Editor, TimerBar 24h)
  → "Lock Video & Submit" → lockVideo() in store
  → C05 (Lock Confirmation, TimerBar 12h)
Brand sees locked video (B09 Content Machine, TimerBar)
  → Clicks "Review" → B12 (Video Review, TimerBar 12h)
  → Clicks "Approve & publish" → approveVideo()
  → publishVideo() → fact.status = 'printed'
  → Creator's WL01 Wallet receives Base Fee + CPM in real-time
```

### Zustand Store Actions (`src/store/perokio.ts`)
```
claimFact(factId, creatorId)     → pushes to claimedBy, status='claimed'
lockVideo(factId, creatorId)     → creates/updates Video record, stage='locked_pending', status='locked'
approveVideo(videoId)             → stage='approved_queued', approved=true
publishVideo(videoId)             → stage='published', fact.status='printed'
settleVideo(videoId)              → stage='settled', views=viewCap, fact.status='paid'
approveScriptLine(factId, lineId, sourceId) → links source to script line
```

### Video Stage Machine
```
drafting → editing → locked_pending → approved_queued → published → counting → settled
```

### Fact Status Machine
```
draft → funded → live → claimed → in_edit → locked → approved → printed → paid
```

### Timers
- **24h lock window** (creator): visible on C03, C04, C06 via TimerBar
- **12h review window** (brand): visible on B09, B12, C05, C06 via TimerBar

---

## 5. ECONOMICS (from `src/lib/perokio/data.ts`)

### Constants
```ts
export const CPM_RATE = 3           // $3 per 1,000 views
export const VIEW_CAP = 10000       // per creator per video
export const MAX_CPM_PAYOUT = (VIEW_CAP / 1000) * CPM_RATE  // = $30
export const USD_TO_TND = 3.1       // Tunisian Dinar conversion
export const LOW_CREDITS_THRESHOLD = 5  // B19 upgrade prompt trigger
```

### Earnings Formula (shared via `useLiveEarnings`)
```
earned = earningsBase + (liveViews / 1000) × CPM_RATE
```
- Base fee: $2–$80 per video (tier-dependent)
- CPM: $3 per 1,000 views (max $30 per video at 10k cap)
- Both WL01 (Wallet) and B17 (Results) read from the **same Zustand selector** (`useLiveEarnings`). Numbers match to the cent.

### Brand Subscription Tiers
| Tier | Price | Credits | Description |
|---|---|---|---|
| Pilot | $400/mo | 10 | Test with 1 active fact |
| Pro | $800/mo | 30 | Up to 3 active facts, priority review |
| Enterprise | $1,500/mo | 50 | Unlimited facts, dedicated Studio liaison |

---

## 6. MOCK DATA (`src/lib/perokio/data.ts`)

| Entity | Count | Notes |
|---|---|---|
| Brands | 4 | Café Dar Zaitouna, Bloom Cosmetics, Tunis Tech Hub, Olive & Co |
| Creators | 5 | Amira (demo user), Yassine, Lina, Omar, Sara |
| Fact Bundles | 6 | Across Hot/Premium/Standard tiers, ar/derja/fr/en languages |
| Videos | 10 | Includes 2 organic underperformers (vid_010 Bloom 42%, vid_011 Olive & Co 28%) |
| Sources | 6 | Official, News, Research, Brand Asset types |
| Transactions | 8 | Stripe topups, Flouci payouts, subscription charges |
| Trends | 6 | #tunisiancoffee, #menabeauty, #oliveoil2024, #techTunisia, #gamingMENA, #saudi2024 |

### Mock Data Display Stats (`src/lib/perokio/mock-data.ts`)
Single source of truth for all display numbers (growth deltas, reward thresholds, streak cycles, chart data series). No hardcoded numbers in JSX — all imported from this file.

---

## 7. STATE MANAGEMENT

### Main Store (`src/store/perokio.ts`)
Zustand store with:
- **Role switching:** `brand` | `creator` | `admin`
- **Navigation:** 12 Brand views, 10 Creator views, 7 Admin views
- **Language:** `en` | `ar` (RTL support via `dir="rtl"`)
- **Active resources:** `activeFactId`, `activeVideoId`, `activeBrandId`
- **Mutation counter:** `walletTick` — bumps on every data mutation so subscribed views re-render
- **Business actions:** 7 actions (claimFact, lockVideo, approveVideo, publishVideo, settleVideo, approveScriptLine, + navigation setters)

### Live Views Store (`src/lib/perokio/use-live-views.ts`)
- **Single source of truth** for video view counts — store-managed timer (not component-managed)
- `useLiveViews(videoId)`: returns live view count, ticks every 3-5s
- `useLiveEarnings(videoId)`: returns `{ views, cpmEarned, totalEarned, baseFee, viewCap, progress }`
- Both WL01 and B17 consume this hook → identical numbers at every tick

### Growth Store (`src/lib/perokio/use-growth-store.ts`)
- Tracks: `profileShares`, `factShares`, `invitesSent`, `invitesAccepted`, `totalCreators`
- Actions: `trackProfileShare()`, `trackFactShare()`, `trackInviteSent()`, `trackInviteAccepted()`
- Derived hooks: `useKFactor()`, `useShareRate()`, `useInviteAcceptance()`
- Consumed by A05 Wall Monitor Growth panel

### Onboarding Store (`src/lib/perokio/onboarding-store.ts`)
- 7-step wizard state: brand identity, industry, tier, trend selection, top-up, creator invites
- `TREND_TEMPLATES`: 5 pre-built trend templates with suggested claims + base fees
- `INDUSTRIES`, `TIERS`, `REGIONS`, `LOGOS`: picker constants

---

## 8. SCREEN INVENTORY (44+ screens)

### Brand Studio (20 screens)
| Code | Screen | File | Key Features |
|---|---|---|---|
| B01-B07 | Onboarding Wizard | `onboarding/onboarding-wizard.tsx` + `steps.tsx` | 7-step flow, one question per screen, cancel confirm dialog, toast + 400ms role transitions |
| B08 | Command Center | `brand/command-center.tsx` | Marquee ticker, ParrotEye (idle blink), toggle wallet eye, Arena Cards with TimerBar, live SVG chart |
| B09 | Content Machine | `brand/content-machine.tsx` | Time-slot calendar, NOW line, TimerBar (replaced Countdown), 12h shrinking review bar |
| B10 | Fact Library | `brand/fact-library.tsx` | Magazine layout (featured hero + 2-col grid), filters (tier/status/language), "New Fact" CTA → A07 |
| B11 | Script Review (Moat) | `brand/script-review.tsx` | Line-level lock/unlock, source tags, publish gating |
| B12 | Video Review | `brand/video-review.tsx` | TimerBar 12h, AnimatedCTA (Approve/Reject morph), Submitted Xh ago |
| B13 | Claim Feed | `brand/claim-feed.tsx` | Slack-style vertical feed, live-updating 3-5s, channel header |
| B14 | Video Detail | `brand/video-review-detail.tsx` | Script line-by-line with timestamps, jump-to-line tabs, 24h view curve |
| B15 | Posting Queue | `brand/posting-queue.tsx` | Mon-Sun × 9am-9pm calendar, drag-to-reschedule, "Ready to post" section |
| B16 | Assisted Post | `brand/assisted-post-modal.tsx` | MODAL (not screen), triggered from B17 when <50% of cap |
| B17 | Results | `brand/results.tsx` | Per-video analytics, useLiveEarnings (same source as WL01), payout breakdown, math proof |
| B18 | Next Cycle | `brand/next-cycle.tsx` | Trend-based recommendations, projected CPM from constants, "Create fact" CTA → A07 |
| B19 | Billing | `brand/billing.tsx` | Conversion surface (not invoice archive), upgrade prompt gated on LOW_CREDITS_THRESHOLD |
| B20 | Settings | `brand/settings.tsx` | Exactly 4 tabs: Account, Team, Integrations, Notifications |

### Creator App (10 screens)
| Code | Screen | File | Key Features |
|---|---|---|---|
| C01 | Facts Wall | `creator/facts-wall.tsx` | Hot Drops gradient carousel, auto-advance on claim (slide-out + toast → C03), card click → C02 |
| C02 | Fact Detail | `creator/fact-detail.tsx` | Full claim, locked script preview, source list, previous creator versions, AnimatedCTA |
| C03 | Claim Confirmation | `creator/claim-confirmation.tsx` | ParrotEye state="claim" (pupil dilation), TimerBar 24h, "Go to editor →" |
| C04 | Hyperframe Editor | `creator/claim-edit.tsx` | TimerBar pinned top, 9:16 frame, timeline strip, asset library, "Lock Video & Submit" → C05, 🦜 watermark |
| C05 | Lock Confirmation | `creator/lock-confirmation.tsx` | Calm (not celebration), ParrotEye idle, TimerBar 12h, "Back to Wall" + "View in Prints" |
| C06 | My Prints | `creator/my-prints.tsx` | Portfolio grid, status filter, TimerBar on in-progress prints, live views via useLiveEarnings, 🦜 watermark |
| C07 | Profile Editor | `creator/profile-editor.tsx` | Edit name/handle/avatar/bio/socials, live ShareCardPreview (OG card updates as you type) |
| U01 | Notifications | `creator/notifications.tsx` | Retention surface (not settings), Slack-style feed, read/unread states, tap-to-navigate |
| WL01 | Wallet | `creator/wallet.tsx` | useLiveEarnings (shared with B17), circular CPM ring, invite-a-creator card, streak/level |
| P03 | Public Profile | `creator/profile.tsx` | Portfolio, stats, achievements |

### Admin Cockpit (7 screens + Cmd+K)
| Code | Screen | File | Key Features |
|---|---|---|---|
| A01 | Brand Pipeline | `admin/brand-pipeline.tsx` | Kanban (lead/demo/pilot/active/churned), HTML5 drag-and-drop, MRR KPIs |
| A02 | Creator Vetting | `admin/creator-vetting.tsx` | Applicant cards, keyboard shortcuts (A=approve, R=reject, J/K=navigate), visual hint pill |
| A03 | Script QA | `admin/script-qa.tsx` | Queue with completion %, cross-link to B11 ("Review Script →") |
| A04 | Trend Input | `admin/trend-input.tsx` | Trend radar, "Convert to Fact Bundle" → toast + 400ms → A07 |
| A05 | Wall Monitor | `admin/wall-monitor.tsx` | Live KPIs, health checks, Growth panel (from useGrowthStore: K-factor, share rate, invite acceptance) |
| A06 | Quality Dashboard | `admin/quality-dashboard.tsx` | Standalone (unmerged from A07), aggregated QA metrics, Recharts bar chart |
| A07 | Fact Authoring | `admin/fact-authoring.tsx` | 3-step authoring, slash commands (/hook, /data, /cta, /source), AI generate button |
| — | Command Palette | `admin/command-palette.tsx` | Global Cmd+K, context-scoped commands (Save draft, Submit to QA, Add source, etc.) |

### Public Surfaces (4 routes + 2 OG endpoints)
| Code | Route | File | Key Features |
|---|---|---|---|
| P01 | `/landing` | `landing/landing.tsx` | Sells creator hustle (not SaaS), Amira's wallet screenshot, 3 real printed facts, B11 explainer |
| P02 | `/login` | `auth/login.tsx` | Visual restyle only (mock setTimeout, no real magic-link), Apple/Google mock buttons |
| P03 | `/creator/[handle]` | `app/creator/[handle]/page.tsx` + `public/creator-profile-view.tsx` | SSR'd, OG meta tags, ShareModal + trackProfileShare(), "Powered by Perokio" badge |
| P04 | `/wall/[factId]` | `app/wall/[factId]/page.tsx` + `public/fact-page-view.tsx` | SSR'd, aggregates all creator versions, OG meta tags, ShareModal + trackFactShare(), "Made with Perokio" badge |
| OG | `/api/og/creator` | `app/api/og/creator/route.tsx` | 1200×630 PNG via next/og ImageResponse, Node.js runtime |
| OG | `/api/og/fact` | `app/api/og/fact/route.tsx` | 1200×630 PNG, claim text in #FFFFFF, brand logo, aggregate stats |

---

## 9. SHARED COMPONENTS (`src/components/perokio/shared/`)

| Component | File | Purpose |
|---|---|---|
| **TimerBar** | `timer-bar.tsx` | Reusable countdown with urgency color-shift (lime→orange→red). Used in B09, B12, C03, C04, C06. |
| **AnimatedCTA** | `animated-cta.tsx` | Button with hover/press/success morph. Variants: primary, ghost, destructive. |
| **FactCard** | `fact-card.tsx` | Reusable card with 4 variants: curator, hunt, review, pipeline. Standardized rating display. |
| **ShareCardPreview** | `share-card-preview.tsx` | OG card preview (1200×630 aspect). Types: creator, fact, payout. "Powered by Perokio" footer. |
| **ShareModal** | `share-modal.tsx` | Reusable share dialog with ShareCardPreview + copyable link + social buttons (X, WhatsApp, Copy). |
| **ParrotLogo / ParrotEye** | `parrot-logo.tsx` | V1 mascot. ParrotEye: idle blink (randomized 3-5s), state reactions (claim=pupil dilation, approve=squint). |
| **AppShell** | `app-shell.tsx` | Top nav: wordmark, live view ticker with ParrotEye, language switcher (EN/ع), role pill, wallet chip. |
| **MobileNav** | `mobile-nav.tsx` | Bottom-floating glass pill, max 5 items + "More" sheet. Per-role items. |
| **SidebarItem** | `sidebar-item.tsx` | Glassmorphism nav row with screen-code chip + lime accent bar. |
| **StatCard** | `stat-card.tsx` | Glass card with accent glow, icon, delta indicator. |
| **Countdown** | `countdown.tsx` | Legacy countdown (used in C01 "Next refresh" only — all lifecycle timers use TimerBar). |
| **ViewTicker** | `view-ticker.tsx` | JetBrains Mono number that ticks up, fires onTick callback for ParrotEye blink. |

---

## 10. VIRAL GROWTH ENGINE (Cycle 8)

### The 3 Viral Loops

1. **Creator Share Loop:** Creator publishes video → their P03 profile auto-generates OG card → creator shares profile link (ShareModal) → audience joins the Wall → `trackProfileShare()` fires in growth store.

2. **Fact Virality Loop:** Every PRINTED fact has a public URL (`/wall/[factId]`) that aggregates all creator versions, total views, and the founding brand. ShareModal fires `trackFactShare()`. SEO + social proof asset.

3. **Brand FOMO Loop:** Every brand's Command Center (B08) shows live creator activity (marquee ticker). B13 Claim Feed shows real-time velocity. B19 Billing surfaces "Top up" when credits are low.

### Growth Store (`src/lib/perokio/use-growth-store.ts`)
```
Seeded: profileShares=8, factShares=4, invitesSent=10, invitesAccepted=7, totalCreators=5
K-factor = (invitesSent × 0.67) / totalCreators  → seeded at 1.34
Share rate = (profileShares + factShares) / totalCreators × 100  → seeded at 240%
Invite acceptance = invitesAccepted / invitesSent × 100  → seeded at 70%
```
A05 Wall Monitor Growth panel reads from this store. Numbers increment when share/invite actions fire.

### Watermark
Every video preview in C04 (Hyperframe Editor) and C06 (My Prints) has a subtle `🦜 Perokio` overlay at 35-40% opacity, bottom-left corner. Premium director's signature, not a cheap watermark.

### Referral
WL01 Wallet has an "Invite a Creator" card with:
- Mock referral link: `perokio.com/join?ref=amira.tn`
- "Copy Invite Link" button → fires `trackInviteSent()` + toast: "Invite link copied. You'll earn $20 when they post."

---

## 11. MOBILE RESPONSIVENESS

- **Sidebars:** `hidden md:flex` (collapse below 768px)
- **Mobile nav:** Bottom-floating glass pill, max 5 items + "More" sheet
  - Brand primary: Command, Content, Facts, Feed, More
  - Creator primary: Wall, Prints, Edit, Alerts, More
  - Admin primary: Pipe, Vet, QA, Trends, More
- **Touch targets:** ≥44px minimum
- **Safe area:** `env(safe-area-inset-bottom)` respected on MobileNav
- **RTL support:** `dir="rtl"` set when language = Arabic, ticker reverses direction

---

## 12. i18n (EN / AR)

- Source strings are English. `t('English string')` returns Arabic translation when `lang === 'ar'`.
- `usePick()` for bilingual content fields (e.g., `pick(fact.claim, fact.claimAr)`)
- 200+ translation entries in `src/lib/perokio/i18n.ts`
- Language switcher in AppShell (EN / ع)
- RTL: document direction flips, ticker animation reverses, Noto Sans Arabic font loads

---

## 13. TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack) | Single `/` route + sub-routes |
| Language | TypeScript 5 (strict) | |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) | Glassmorphism utilities in globals.css |
| State | Zustand | 4 stores: perokio, use-live-views, use-growth-store, onboarding-store |
| Animation | Framer Motion | Spring curves, AnimatePresence, layout animations |
| Charts | Recharts | Area charts (views, earnings), LineChart (24h curve), BarChart (QA dashboard) |
| Icons | Lucide React | |
| Date math | date-fns | TimerBar countdowns |
| OG images | next/og ImageResponse | Node.js runtime, 1200×630 PNG |
| Command palette | cmdk (via shadcn) | Global Cmd+K in Admin context |
| Fonts | Fraunces (serif), Inter (sans), JetBrains Mono (mono), Noto Sans Arabic | Loaded via next/font/google |

### File Structure
```
src/
├── app/                          # Next.js App Router routes
│   ├── page.tsx                  # Main app (role switcher)
│   ├── layout.tsx                # Root layout (fonts, ThemeProvider)
│   ├── globals.css               # Design system (colors, glass, animations)
│   ├── landing/page.tsx          # P01 Landing
│   ├── login/page.tsx            # P02 Login
│   ├── onboarding/page.tsx       # B01-B07 Wizard
│   ├── creator/[handle]/page.tsx # P03 Creator Profile (SSR)
│   ├── wall/[factId]/page.tsx    # P04 Fact Page (SSR)
│   └── api/og/{creator,fact}/    # OG image endpoints
├── components/
│   ├── perokio/
│   │   ├── brand/                # 14 brand screen components
│   │   ├── creator/              # 12 creator screen components
│   │   ├── admin/                # 8 admin screen components + command palette
│   │   ├── shared/               # 12 reusable components
│   │   ├── public/               # 2 public view components
│   │   ├── landing/              # 1 landing component
│   │   ├── onboarding/           # 2 wizard components
│   │   └── auth/                 # 1 login component
│   └── ui/                       # ~40 shadcn/ui components
├── lib/
│   ├── perokio/
│   │   ├── data.ts               # Mock data (10 videos, 6 facts, 4 brands, 5 creators)
│   │   ├── mock-data.ts          # Display stats (single source of truth for numbers)
│   │   ├── types.ts              # TypeScript interfaces
│   │   ├── i18n.ts               # EN/AR translations
│   │   ├── format.ts             # Pure formatters (server-safe)
│   │   ├── live.ts               # Live views hook + re-exports
│   │   ├── motion.ts             # Spring curves + variants
│   │   ├── use-live-views.ts     # Shared Zustand live views store
│   │   ├── use-growth-store.ts   # Viral metrics tracking
│   │   ├── use-reduced-motion.ts # Accessibility hook
│   │   └── onboarding-store.ts   # Wizard state
│   ├── utils.ts                  # cn() helper
│   └── db.ts                     # Prisma client
├── store/
│   └── perokio.ts                # Main Zustand store
└── hooks/
    ├── use-mobile.ts
    └── use-toast.ts
```

---

## 14. KNOWN LIMITATIONS (V1)

| Item | Status | V2 Target |
|---|---|---|
| 3D Parrot mascot | Deferred to V2. 2D SVG ParrotEye is V1's mascot. | Procedural R3F or designed GLTF |
| Real Stripe/Flouci integration | UI stubs only (toast + mock). | Stripe Connect + Flouci API |
| Real Postiz publishing | UI only. No actual social media posting. | Postiz REST API |
| Real Hyperframe editor | Mock 9:16 frame with emoji thumbnails. | Hyperframe iframe or canvas |
| Real magic-link auth | Mock setTimeout. | NextAuth.js or custom email OTP |
| Persistence | All Zustand stores are in-memory. No localStorage/database persistence. | Postgres + Prisma |
| OG card caching | Generated on-demand, 1h cache. | Pre-generate at build time |
| Social share buttons | Mock (copy link works, no window.open to Twitter/WhatsApp). | Web Share API + platform intents |
| Analytics (PostHog) | Growth store tracks events but doesn't send to external analytics. | PostHog integration |

---

## 15. WHAT SUCCESS LOOKS LIKE (from the original spec)

When you open the preview:

- ✅ The landing page makes you want to sign up as a creator immediately. It does not read like a SaaS template.
- ✅ The 2D parrot eye reacts to your actions (idle blink, claim dilation, approve squint) and never stutters.
- ✅ Every timer feels tense but not stressful (TimerBar color-shifts lime→orange→red).
- ✅ Every CTA feels rewarding to tap (AnimatedCTA morph + success label swap).
- ✅ The Fact Library (B10) and Facts Wall (C01) feel distinct — one is a curator's tool, the other is a hunt.
- ✅ B11 Script Review still blocks publishing when a line is unverified. Nothing weakened the moat.
- ✅ The E2E loop works: claim → lock → approve → PRINTED → wallet.
- ✅ The share card for creator profiles looks good enough to post on Twitter.
- ✅ B17 and WL01 show the exact same dollar figure for the same video (single Zustand source).
- ✅ Mobile nav is 5 items max, with a "More" sheet for secondary screens.
