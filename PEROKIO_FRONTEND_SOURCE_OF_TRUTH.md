# 🦜 PEROKIO FRONTEND SOURCE OF TRUTH (V1.1 — Revenue OS)

> **Status:** V1.1 Locked. Frontend Phases 1-3 complete (API integration + UX polish + Revenue OS). 547 tracked files, 50+ components, 5 Zustand stores, 8 app routes.
> **Stack:** Next.js 16 (App Router) · TypeScript 5 · Tailwind CSS 4 · Zustand · Framer Motion · Recharts · shadcn/ui
> **Design Language:** Dark Glassmorphism, Editorial Serif × Mono Numbers, Spring Physics
> **Last updated:** November 2026 (post-Revenue OS)
> **Price Point:** $499/month

---

## ⚠️ THE LIVING DOCUMENT RULE (CRITICAL)

**This file is the single source of truth for the frontend.** Every future code edit MUST update this document in the same commit.

| If you... | Then you MUST... |
|---|---|
| Add a new component | Add it to **Section 4 (Component Inventory)** with its file path |
| Add a new UX flow | Add it to **Section 2 (Revenue OS UX Flow)** |
| Change a design token (color, font, spacing) | Update **Section 1 (Design System)** |
| Add/modify a Zustand store action | Update **Section 4 (Zustand Stores)** |
| Add a new screen | Add it to the Component Inventory + note its route |
| Change the B11 gate behavior | Update **Section 5 (The B11 Moat)** |
| Add a new API endpoint integration | Update **Section 6 (Integration Rules)** |

**Failure to update this document is a build-breaking offense.** The document is checked at PR review.

---

## SECTION 1: DESIGN SYSTEM & TOKENS

### 1.1 Colors (Locked — do not change)

| Token | Hex | Usage |
|---|---|---|
| **Background** | `#0A0F0D` | Deep dark, always-on. No light mode. Ambient gradient overlays applied via `body` in `globals.css`. |
| **Primary (Lime)** | `#D8EF70` | Signal Lime — verified, success, primary CTAs, the B11 moat |
| **Urgency (Orange)** | `#ED7A42` | Opportunity Orange — urgent, opportunity, warnings, Sparks |
| **Danger (Red)** | `#E5484D` | Alert Red — destructive, blocked, critical, unverified lines |
| **Teal** | `#6FD3C7` | Cool Teal — tertiary accent, AI generation, script hooks |
| **Violet** | `#B6A6FF` | Soft Violet — Elite/premium accent, Magic Write, AI suggestions |

**CSS variable mapping** (in `globals.css` → `:root`):
```css
--background: #0A0F0D;
--primary: #D8EF70;           /* Lime */
--secondary-foreground: #ED7A42;  /* Orange */
--destructive: #E5484D;       /* Red */
--chart-4: #6FD3C7;           /* Teal */
--chart-5: #B6A6FF;           /* Violet */
```

**Text opacity tiers:**
- `text-fg` → `rgba(255,255,255,0.92)` — primary text
- `text-muted-fg` → `rgba(255,255,255,0.55)` — secondary text
- `text-subtle` → `rgba(255,255,255,0.35)` — tertiary/placeholder

### 1.2 Typography

| Font | Family | Usage | CSS Class |
|---|---|---|---|
| **Fraunces** | `var(--font-fraunces)` | Headlines, section titles, large numbers (wallet balance) | `.font-serif` / `h1-h6` |
| **Inter** | `var(--font-inter)` | UI body, labels, navigation, buttons | default body |
| **JetBrains Mono** | `var(--font-jetbrains)` | Numbers, timers, codes, monetary values, hashes | `.font-mono` / `[data-mono]` |
| **Noto Sans Arabic** | `var(--font-noto-arabic)` | RTL Arabic text (loaded when `lang='ar'`) | `[dir="rtl"]` |

**Typography rules:**
- All headings use `letter-spacing: -0.02em` (tight tracking)
- All monospace numbers use `font-variant-numeric: tabular-nums` (aligned columns)
- The `[data-mono]` attribute triggers JetBrains Mono — use it on every number, code, and timestamp

### 1.3 Glassmorphism CSS Classes

All defined in `src/app/globals.css` → `@layer utilities`:

| Class | Background | Border | Blur | Usage |
|---|---|---|---|---|
| `.glass` | `rgba(255,255,255,0.04)` | `1px rgba(255,255,255,0.08)` | `blur(20px) saturate(140%)` | Default cards, panels |
| `.glass-strong` | `rgba(255,255,255,0.07)` | `1px rgba(255,255,255,0.12)` | `blur(28px) saturate(160%)` | Modals, dropdowns |
| `.glass-lime` | `linear-gradient(135deg, rgba(216,239,112,0.10), rgba(216,239,112,0.02))` | `1px rgba(216,239,112,0.25)` | `blur(20px)` | Verified lines, success, primary CTAs |
| `.glass-orange` | `linear-gradient(135deg, rgba(237,122,66,0.10), rgba(237,122,66,0.02))` | `1px rgba(237,122,66,0.25)` | `blur(20px)` | Urgency, timers, opportunities |
| `.glass-red` | `linear-gradient(135deg, rgba(229,72,77,0.10), rgba(229,72,77,0.02))` | `1px rgba(229,72,77,0.30)` | `blur(20px)` | Blocked, errors, unverified |
| `.glass-premium` | `rgba(255,255,255,0.03)` | `1px rgba(255,255,255,0.08)` | `blur(32px) saturate(160%)` | Premium cards (WeekGrid, Campaign Studio). Adds inner glow + layered shadow. |

### 1.4 Premium CSS Classes (Revenue OS additions)

| Class | Purpose |
|---|---|
| `.source-chip` | Pill-shaped lime badge with lock icon (🔒 SRC-01) for verified script lines |
| `.gate-locked` | `opacity: 0.5; cursor: not-allowed; filter: grayscale(40%)` — the disabled B11 approve button |
| `.day-column` | WeekGrid day cell — raises on hover (`translate-y-[-2px]` + soft shadow) |
| `.skeleton-premium` | Pulsing lime glassmorphic skeleton for AI loading states (replaces spinners) |
| `.certificate-border` | SHA-256 receipt modal border (lime glow + layered shadow) |
| `.success-ring-glow` | `drop-shadow(0 0 6px rgba(216,239,112,0.6))` for the Success Score SVG ring |
| `.animate-breathe-slow` | Slow breathing pulse (3.5s) for the Monday Lock indicator |
| `.animate-count-up` | Number count-up entrance animation (0.6s cubic-bezier) |
| `.glow-lime` / `.glow-orange` / `.glow-red` | Box-shadow glow for CTA buttons |
| `.shadow-lime-glow` / `.shadow-orange-glow` | Elevation glow tokens |

### 1.5 Motion System (`src/lib/perokio/motion.ts`)

**Locked spring curves — imported by every animated component:**

| Curve | Type | Stiffness | Damping | Usage |
|---|---|---|---|---|
| `springSoft` | Spring | 120 | 20 | State changes, panel mount/unmount, card entrances |
| `springSnappy` | Spring | 300 | 25 | Microinteractions — button hover/tap, ticker ticks, copy morph |
| `easeEditorial` | Tween | — | — | Entrances — `cubic-bezier(0.22, 0.61, 0.36, 1)`, duration 0.5s |

**Elevation tokens:**
- `shadows.glass` → `0 20px 60px rgba(0,0,0,0.4)`
- `shadows.limeGlow` → `0 0 24px rgba(216,239,112,0.4)`
- `shadows.orangeGlow` → `0 0 24px rgba(237,122,66,0.4)`

**Rules:**
- NEVER use linear transitions for hover/click states. Always `springSoft` or `springSnappy`.
- Entrances (cards, panels) use `easeEditorial`.
- `prefers-reduced-motion` is checked via `useReducedMotion()` hook — disables all decorative animations.

### 1.6 Radii

| Token | Value | Usage |
|---|---|---|
| Control | 14px | Buttons, inputs, small chips |
| Card | 20px | Glass cards, panels |
| Hero | 26px | Large hero sections, modals |
| Pill | 999px | Badges, source chips, indicator dots |

---

## SECTION 2: THE REVENUE OS UX FLOW (THE $100M LOOP)

The Perokio user journey is not a linear dashboard — it is a **compounding flywheel**. Every screen drives the user toward generating measurable ROI. The UI visually reinforces this cycle:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   1. Scan Market (AI)                                          │
│      ↓  B08 [📡 Scan Market] button → radar animation          │
│      ↓  AI Copilot: "🔥 #IcedCoffee is exploding"              │
│                                                                 │
│   2. Generate Assets                                           │
│      ↓  B10 [+ Generate Fact Bundle] → RAG skeleton loading    │
│      ↓  B11 Script Review — verify lines → Approve & Launch    │
│                                                                 │
│   3. Build Campaign (Smart Link + Page)                       │
│      ↓  B10 [🚀 Build Campaign] → CampaignStudio Phase 1       │
│      ↓  Phase 1: pero.to/ smart link + A/B routing             │
│      ↓  Phase 2: Page editor + iPhone live preview             │
│                                                                 │
│   4. Approve (B11 Gate)                                       │
│      ↓  B11 ApproveButton — physically locked until verified   │
│      ↓  SHA-256 rubber stamp animation → Certificate modal     │
│                                                                 │
│   5. Distribute (Creators)                                    │
│      ↓  C01 Facts Wall → Claim → C04 Editor → Lock             │
│      ↓  B12 Video Review → Approve → Publish via Postiz        │
│                                                                 │
│   6. Monitor Revenue (TastyIgniter)                           │
│      ↓  B08 Orders + Revenue cards (clickable → CampaignStudio)│
│      ↓  A08 Lead Magnet — Total Clicks, Orders, CVR, Revenue   │
│      ↓  CampaignStudio Phase 3: Revenue Waterfall + Leaderboard│
│                                                                 │
│   7. AI Optimization                                          │
│      ↓  AI Copilot: "⚠️ CPM up 15%. Boost Amira's Spark"      │
│      ↓  B08 [Boost] on underperforming videos → B17 Results    │
│                                                                 │
│   8. Repeat                                                    │
│      ↓  CampaignStudio Phase 3: [Launch Next Campaign →]       │
│      ↓  B08 bottom CTA: [Create New Promo Cycle →]             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How the UI Enforces the Loop

| Mechanism | Location | Purpose |
|---|---|---|
| **AI Copilot pill** | Floating, bottom-center of B08 | Proactively suggests the next action (boost, generate, launch). Rotates every 8s. Makes the app feel alive. |
| **[Create New Promo Cycle →]** | B08 bottom CTA (glowing lime) | The compounding loop CTA — always visible, always inviting the next cycle. |
| **[📡 Scan Market]** | B08 toolbar | Triggers radar animation → routes to B18 (Next Cycle / trends). Entry point for the flywheel. |
| **[+ Generate Fact Bundle]** | B10 header | Triggers RAG pipeline loading skeletons → creates a new ScriptVersion with `verified=false` lines. |
| **[🚀 Build Campaign]** | B10 fact cards + header | Opens CampaignStudio → the $499 feature. |
| **B11 Approve & Launch** | B11 Script Review | Physically locked until 100% verified. SHA-256 stamp on approval. |
| **Orders + Revenue cards** | B08 KPI grid (clickable) | The "Aha!" moment — dollar amounts rolling up. Routes to CampaignStudio Phase 3 (ROI funnel). |
| **Revenue Waterfall** | CampaignStudio Phase 3 | Views → Clicks → Page Views → Orders. Shows dropoff at each step. |
| **Attribution Leaderboard** | CampaignStudio Phase 3 | Which creator drove the most revenue. Celebrates the creator economy. |
| **[Launch Next Campaign →]** | CampaignStudio Phase 3 (after 2s delay) | The loop closer — glowing lime button that starts the next cycle. |

### The "Aha!" Moment

The exact second a brand sees a dollar amount ($) roll up next to a Spark they approved 24 hours ago. The UI celebrates this via:
1. **CountUp animation** — numbers roll from 0 to the target value (spring physics)
2. **Lime glow** — the Revenue card pulses with `glow-lime`
3. **AI Copilot toast** — "📈 You hit $1,840 in attributed revenue this week."

---

## SECTION 3: THE CAMPAIGN STUDIO ARCHITECTURE

**File:** `src/components/perokio/campaign/campaign-studio.tsx`

A full-screen, immersive glassmorphic 3-phase wizard powered by `AnimatePresence`.

### Phase 1: Smart Link & Routing Hub

| Element | Implementation |
|---|---|
| Smart Link input | Massive `pero.to/` prefix input in a `glass-premium` container |
| Dynamic Routing (A/B Testing) | Up to 4 destination URLs with auto-calculated weight sliders (lime/orange bars) |
| Copy button | Morphs to "✓ Copied" with `springSnappy` scale pop + 8-particle mini confetti burst |
| Add Variant button | Adds a new variant, recalculates weights to equal split |

### Phase 2: Conversion Canvas (Page Editor)

| Element | Implementation |
|---|---|
| Layout | Split-screen: Left = editor, Right = iPhone 15 Pro mock frame (300×620px) |
| iPhone mock | Notch, rounded screen, live-updating content with `springSnappy` on every keystroke |
| Magic Write | `[✨ Magic Write]` button generates 3 RAG-grounded headline suggestions. Skeleton loading (pulsing glassmorphic lines) for 1.2s, then animated suggestions slide in. |
| Hero Image | Glassmorphic drop zone with shimmer loading state, `border-dashed` → `border-lime/30` on hover |
| Headline / Subhead | Auto-saves as you type. iPhone preview updates instantly. |
| Social Proof Widget | "🔥 1,240 people ordered this week" — editable text |
| CTA Button | Customizable text + links to TastyIgniter |

### Phase 3: ROI Command Center (Funnel Tracking)

| Element | Implementation |
|---|---|
| Revenue Waterfall | Step-down funnel: Views (10k) → Clicks (1.2k) → Page Views (1k) → Orders (45). Each stage animated with `CountUp` + width bar. Dropoff % shown between stages. |
| Revenue Chart | Recharts `AreaChart` — 7-day revenue trend with lime gradient fill |
| Attribution Leaderboard | Ranked list of creators by revenue. Avatar, orders count, % share bar, revenue `CountUp`. |
| Loop CTA | Massive glowing lime `[Launch Next Campaign →]` button. Appears after 2s delay ( anticipation). |

### Phase Indicator

3-step indicator in the header. Completed phases show a checkmark. Current phase is scaled 1.1× with lime accent.

---

## SECTION 4: COMPONENT INVENTORY & FILE STRUCTURE

### 4.1 Revenue OS Components (new in V1.1)

| Component | File Path | Purpose |
|---|---|---|
| **CampaignStudio** | `src/components/perokio/campaign/campaign-studio.tsx` | The $499 feature — 3-phase modal (Smart Link → Page Editor → ROI Funnel). Full-screen glassmorphic environment. |
| **CommandCenterToolbar** | `src/components/perokio/campaign/command-center-toolbar.tsx` | B08 toolbar: [Schedule Content] drawer + [Scan Market] radar + AI Copilot floating pill + [Create New Promo Cycle] bottom CTA. |
| **FactLibraryHeader** | `src/components/perokio/campaign/fact-library-header.tsx` | B10 header: search + [Generate Fact Bundle] (triggers RAG skeletons) + [Build Campaign] (opens CampaignStudio). |
| **B11ApproveButton** | `src/components/perokio/campaign/b11-approve-button.tsx` | Gated approval button: physically disabled when lines unverified, SHA-256 rubber stamp animation + Certificate modal on success. |

### 4.2 Core Shared Components

| Component | File Path | Purpose |
|---|---|---|
| **WeekGrid** | `src/components/perokio/shared/week-grid.tsx` | The Calendar-as-Spine. 7-day grid, Facts (lime) + Sparks (orange). Monday 9am Lock indicator with breathing pulse. Day columns raise on hover. |
| **ApprovalModal** | `src/components/perokio/shared/approval-modal.tsx` | Full-screen B12 success modal: "Video Approved. Auto-publishing in 1 hour via Postiz." + [View Schedule] + [Back to Dashboard]. |
| **CountUp** | `src/components/perokio/shared/count-up.tsx` | Animated number that rolls from 0 to target on mount. Uses Framer Motion `animate()`. Stagger via `delay` prop. |
| **SuccessScoreRing** | `src/components/perokio/shared/success-score-ring.tsx` | Circular SVG progress ring (0-100). Lime glow. Used in B08, B14, B17 for the Success Score badge. |
| **TimerBar** | `src/components/perokio/shared/timer-bar.tsx` | Reusable countdown with urgency color-shift (lime→orange→red). Used in B09, B12, C03, C04, C06. |
| **AnimatedCTA** | `src/components/perokio/shared/animated-cta.tsx` | Button with hover/press/success morph. Variants: primary, ghost, destructive. |
| **FactCard** | `src/components/perokio/shared/fact-card.tsx` | Reusable card with 4 variants: curator, hunt, review, pipeline. |
| **ShareCardPreview** | `src/components/perokio/shared/share-card-preview.tsx` | OG card preview (1200×630 aspect). Types: creator, fact, payout. |
| **ShareModal** | `src/components/perokio/shared/share-modal.tsx` | Reusable share dialog with ShareCardPreview + copyable link + social buttons. |
| **ParrotLogo / ParrotEye** | `src/components/perokio/shared/parrot-logo.tsx` | V1 mascot. ParrotEye: idle blink (randomized 3-5s), state reactions (claim=pupil dilation, approve=squint). |
| **AppShell** | `src/components/perokio/shared/app-shell.tsx` | Top nav: wordmark, live view ticker with ParrotEye, language switcher (EN/ع), role pill, wallet chip. |
| **MobileNav** | `src/components/perokio/shared/mobile-nav.tsx` | Bottom-floating glass pill, max 5 items + "More" sheet. `bg-[#0A0F0D]/80 backdrop-blur-xl`. |
| **SidebarItem** | `src/components/perokio/shared/sidebar-item.tsx` | Glassmorphism nav row with screen-code chip + lime accent bar. |
| **StatCard** | `src/components/perokio/shared/stat-card.tsx` | Glass card with accent glow, icon, delta indicator. |
| **Countdown** | `src/components/perokio/shared/countdown.tsx` | Legacy countdown (used in C01 "Next refresh" only — all lifecycle timers use TimerBar). |
| **ViewTicker** | `src/components/perokio/shared/view-ticker.tsx` | JetBrains Mono number that ticks up, fires onTick callback for ParrotEye blink. |

### 4.3 Brand Screens

| Screen | File Path | Code |
|---|---|---|
| Command Center | `src/components/perokio/brand/command-center.tsx` | B08 |
| Content Machine | `src/components/perokio/brand/content-machine.tsx` | B09 |
| Script Review (B11 Moat) | `src/components/perokio/brand/script-review.tsx` | B11 |
| Fact Library | `src/components/perokio/brand/fact-library.tsx` | B10 |
| Claim Feed | `src/components/perokio/brand/claim-feed.tsx` | B13 |
| Video Review | `src/components/perokio/brand/video-review.tsx` | B12 |
| Video Review Detail | `src/components/perokio/brand/video-review-detail.tsx` | B14 |
| Posting Queue | `src/components/perokio/brand/posting-queue.tsx` | B15 |
| Results | `src/components/perokio/brand/results.tsx` | B17 |
| Next Cycle | `src/components/perokio/brand/next-cycle.tsx` | B18 |
| Billing | `src/components/perokio/brand/billing.tsx` | B19 |
| Settings | `src/components/perokio/brand/settings.tsx` | B20 |
| Assisted Post Modal | `src/components/perokio/brand/assisted-post-modal.tsx` | B16 |
| Brand App Shell | `src/components/perokio/brand/brand-app.tsx` | — |

### 4.4 Creator Screens

| Screen | File Path | Code |
|---|---|---|
| Facts Wall | `src/components/perokio/creator/facts-wall.tsx` | C01 |
| Fact Detail | `src/components/perokio/creator/fact-detail.tsx` | C02 |
| Claim Confirmation | `src/components/perokio/creator/claim-confirmation.tsx` | C03 |
| Edit Studio | `src/components/perokio/creator/claim-edit.tsx` | C04 |
| Lock Confirmation | `src/components/perokio/creator/lock-confirmation.tsx` | C05 |
| My Prints | `src/components/perokio/creator/my-prints.tsx` | C06 |
| Profile | `src/components/perokio/creator/profile.tsx` | P03 |
| Profile Editor | `src/components/perokio/creator/profile-editor.tsx` | C07 |
| Wallet | `src/components/perokio/creator/wallet.tsx` | WL01 |
| Notifications | `src/components/perokio/creator/notifications.tsx` | U01 |
| Creator App Shell | `src/components/perokio/creator/creator-app.tsx` | — |

### 4.5 Admin Screens

| Screen | File Path | Code |
|---|---|---|
| Brand Pipeline | `src/components/perokio/admin/brand-pipeline.tsx` | A01 |
| Creator Vetting | `src/components/perokio/admin/creator-vetting.tsx` | A02 |
| Script QA | `src/components/perokio/admin/script-qa.tsx` | A03 |
| Trend Input | `src/components/perokio/admin/trend-input.tsx` | A04 |
| Wall Monitor | `src/components/perokio/admin/wall-monitor.tsx` | A05 |
| Quality Dashboard | `src/components/perokio/admin/quality-dashboard.tsx` | A06 |
| Fact Authoring | `src/components/perokio/admin/fact-authoring.tsx` | A07 |
| Lead Magnet | `src/components/perokio/admin/lead-magnet.tsx` | A08 |
| Command Palette | `src/components/perokio/admin/command-palette.tsx` | Cmd+K |
| Admin App Shell | `src/components/perokio/admin/admin-app.tsx` | — |

### 4.6 Other Components

| Component | File Path | Purpose |
|---|---|---|
| Landing | `src/components/perokio/landing/landing.tsx` | P01 — public marketing page |
| Login | `src/components/perokio/auth/login.tsx` | P02 — JWT auth (email + password, demo accounts) |
| Onboarding (collapsed) | `src/components/perokio/onboarding/onboarding-collapsed.tsx` | B01-B07 — 3-field screen + live WeekGrid preview |
| Onboarding (legacy wizard) | `src/components/perokio/onboarding/onboarding-wizard.tsx` | Original 7-step wizard (deprecated, kept for reference) |
| Creator Profile View | `src/components/perokio/public/creator-profile-view.tsx` | P03 — public SSR creator profile |
| Fact Page View | `src/components/perokio/public/fact-page-view.tsx` | P04 — public SSR fact page |

### 4.7 Zustand Stores

| Store | File Path | Purpose |
|---|---|---|
| **usePerokioStore** | `src/store/perokio.ts` | Main store: role switching, navigation, active resources, business operations. Delegates to real API when authenticated (via `getAccessToken()`), falls back to mock data in demo mode. Actions: `claimFact`, `lockVideo`, `approveScriptLine`, `approveScript`, `approveVideo`, `publishVideo`, `settleVideo`, `rateVideo`, `fetchFacts`. |
| **useAuthStore** | `src/lib/perokio/auth-store.ts` | JWT session management. `login()`, `signup()`, `logout()`, `restoreSession()`. Maps backend 8-role enum → frontend 3-role (brand/creator/admin). Stores access token in memory, refresh token in localStorage. |
| **useLiveDataStore** | `src/lib/perokio/live-data-store.ts` | API data cache. `fetchFacts()`, `fetchScriptsInQa()`, `fetchPipeline()`, `generateScript()`, `verifyLine()`, `approveScript()`, `claimFact()`, `lockVideo()`, `rateVideo()`, `publishVideo()`, `settleVideo()`, `triggerTopUp()`. Loading states + error handling for every action. |
| **useGrowthStore** | `src/lib/perokio/use-growth-store.ts` | Viral metrics. Tracks `profileShares`, `factShares`, `invitesSent`, `invitesAccepted`. Derived hooks: `useKFactor`, `useShareRate`, `useInviteAcceptance`. |
| **brandOnboardingStore** | `src/lib/perokio/onboarding-store.ts` | Wizard state (legacy 7-step). Fields: brandName, industry, monthlyBudget, topUpAmount, selectedTrend, invitedCreators. |

### 4.8 API Client

**File:** `src/lib/perokio/api-client.ts`

The bridge between the frontend and the NestJS backend. Handles:
- JWT auth (access token in memory, refresh token in localStorage for dev)
- Auto-refresh on 401 responses
- Typed fetch wrappers for all API endpoints
- Backend → frontend type adapters (Fact, ScriptLine, Video, Source)
- Error normalization with `ApiError` class

**API modules:**
- `authApi` — signup, login, refresh, me
- `factsApi` — list, get, create, generate (RAG)
- `scriptsApi` — addLine, updateLine, linkSource, unlinkSource, createSource, listSources, approve (B11 gate), verifyLine
- `claimsApi` — claimFact, lockVideo
- `adminApi` — submitTranscript, overrideDeviation, rateVideo, getPipeline
- `distributionApi` — publish, ingestAnalytics, settle, dismissAnomaly
- `financeApi` — triggerStripeTopUp, listPayouts, approvePayout
- `harnessApi` — createConfig, listConfigs, runEval, activate
- `conversionApi` — getStats, triggerCtaClick, triggerOrder

### 4.9 App Routes

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Main app (role switcher — Brand / Creator / Admin) |
| `/login` | `src/app/login/page.tsx` | P02 Login |
| `/landing` | `src/app/landing/page.tsx` | P01 Landing |
| `/onboarding` | `src/app/onboarding/page.tsx` | B01-B07 Onboarding |
| `/creator/[handle]` | `src/app/creator/[handle]/page.tsx` | P03 Creator Profile (SSR) |
| `/wall/[factId]` | `src/app/wall/[factId]/page.tsx` | P04 Fact Page (SSR) |
| `/api/og/creator` | `src/app/api/og/creator/route.tsx` | OG image (creator, 1200×630) |
| `/api/og/fact` | `src/app/api/og/fact/route.tsx` | OG image (fact, 1200×630) |

---

## SECTION 5: THE B11 MOAT (FRONTEND ENFORCEMENT)

The B11 Script Review screen is the core trust mechanism. The frontend enforces the moat visually so the user FEELS the security.

### 5.1 The Locked Gate

**Component:** `B11ApproveButton` (`src/components/perokio/campaign/b11-approve-button.tsx`)

When any `ScriptLine` has `verified = false`:

| Property | Value |
|---|---|
| `disabled` | `true` |
| CSS class | `gate-locked` (opacity: 0.5, cursor: not-allowed, filter: grayscale(40%)) |
| Button text | "Locked — finish verification" |
| Icon | Lock (🔒) |
| Hover behavior | Shows tooltip: "N sources missing. B11 Gate locked." |

When all lines are verified (`allVerified = true`):

| Property | Value |
|---|---|
| `disabled` | `false` |
| CSS class | `bg-lime text-[#0A0F0D] glow-lime` |
| Button text | "Approve & Launch" |
| Icon | CheckCircle2 (✓) |
| Hover behavior | `whileHover: { scale: 1.01 }` (springSnappy) |

### 5.2 The SHA-256 Rubber Stamp Animation

On click (when verified), the button:
1. Calls `onApprove()` → which calls `POST /api/scripts/:id/approve` via the Zustand store
2. The backend returns `{ success: true, hash: "abc123..." }`
3. Triggers the **RubberStamp** component — an SVG with curved text "VERIFIED BY PEROKIO STUDIO" + "MOAT ENGINE · B11"
4. Spring scale-in: `initial: { scale: 1.6, rotate: -25 }` → `animate: { scale: 1, rotate: -12 }` (stiffness: 280, damping: 14)
5. Holds for 1.5s, then fades out
6. After 600ms, opens the **CertificateModal** showing the SHA-256 hash

### 5.3 The Certificate Modal

Displays:
- ShieldCheck icon (lime, with `success-ring-glow`)
- "Verification Receipt" title (Fraunces serif)
- The SHA-256 hash in monospace (break-all, lime, 10px)
- "This receipt proves the script was 100% source-verified at approval time."
- [Copy hash] + [Done] buttons

### 5.4 Source Chips

Every verified `ScriptLine` displays a pill-shaped `.source-chip` badge:
- Lock icon (🔒) + source ID (e.g., "SRC-01")
- Lime gradient background with border
- Hover: border brightens + lime glow shadow

### 5.5 Backend Enforcement (Defense in Depth)

The frontend gate is backed by TWO backend checks:
1. **App-level:** `ScriptsService.approve()` queries all `ScriptLine` records. If any `verified = false` → `400 B11_VERIFICATION_FAILED` with the offending line IDs.
2. **DB-level:** Raw SQL `SELECT COUNT(*) WHERE verified = false` — even if the app check is bypassed, the DB refuses.

The frontend `approveScript()` action in the Zustand store catches the `400` and returns `{ success: false, error: 'B11_VERIFICATION_FAILED' }` — which the button displays as a toast.

---

## SECTION 6: INTEGRATION RULES

### 6.1 Never Break the API Contract

The NestJS backend API contract is documented in `backend/PEROKIO_BACKEND_SOURCE_OF_TRUTH.md` (Section 4: The API Contract). The frontend MUST:

- **Never** assume a response shape that isn't documented in the backend SOT.
- **Never** send a request body with fields the backend doesn't expect.
- **Always** use the `api-client.ts` module's typed wrappers (`factsApi`, `scriptsApi`, etc.) — never raw `fetch()` calls in components.
- **Always** handle the `ApiError` class — catch 400/401/403/409 responses and show user-friendly toasts.

### 6.2 Every Button Must Hit a Real Endpoint (or a Clearly Defined Mock)

| If the button... | Then it MUST... |
|---|---|
| Triggers a backend mutation (claim, lock, approve, publish) | Call the real API via the Zustand store action (which delegates to `api-client.ts`) |
| Is a UI-only action (navigate, toggle, filter) | Use `setView()` / `setActiveFact()` / local `useState` — no API call needed |
| Is a "demo" button (simulate order, test webhook) | Call the real webhook endpoint (`POST /webhooks/tastyigniter/order`) — never fake the response locally |
| Is a "coming soon" placeholder | Show a toast: "This feature is coming in V2" — never silently do nothing |

### 6.3 The Dual-Mode Pattern

The Zustand store uses `isLiveMode()` (checks `getAccessToken()`) to determine whether to call the real API or fall back to mock data:

```typescript
if (isLiveMode()) {
  // Call the real API
  const result = await claimsApi.claimFact(factId)
  return result.video.id
}
// Demo mode fallback (mock mutation)
fact.claimedBy.push(creatorId)
```

This means:
- **When authenticated** (user logged in) → real API calls, real BullMQ timers, real ledger entries
- **When not authenticated** (demo mode) → in-memory mock mutations, no backend calls

**Rule:** Never remove the demo-mode fallback. It allows the UI to be demoed without a running backend.

### 6.4 Environment Variables

| Variable | Default (dev) | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | The backend API base URL. Baked into the Next.js build. |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/perokio` | Backend only — not used by frontend |
| `REDIS_URL` | `redis://localhost:6379` | Backend only — not used by frontend |
| `JWT_SECRET` | `perokio-dev-secret-change-in-production` | Backend only — the frontend stores the JWT it receives |

### 6.5 Mobile Navigation

- All 3 app shells (brand, creator, admin) have `pb-24` on the main scroll container
- The `MobileNav` component uses `bg-[#0A0F0D]/80 backdrop-blur-xl`
- Max 5 primary items per role + "More" sheet for secondary screens
- The AI Copilot pill floats at `bottom-24` so it doesn't overlap the mobile nav

---

## APPENDIX: PROOF INDEX

| Proof File | What it proves |
|---|---|
| `backend/scripts/proof-b11-gate.sh` | B11 gate blocks approval (400) when lines are unverified |
| `backend/scripts/proof-harness-eval.sh` | RAG pipeline catches hallucination, activation blocked |
| `backend/scripts/proof-rag-pipeline.sh` | RAG context assembled, LLM suggests source_ids, pre-linked but `verified=false` |
| `backend/scripts/proof-print-rating.sh` | Print rating 400 on `brandSafety=false`, 201 on both gates true |
| `backend/scripts/proof-frontend-e2e.sh` | Full E2E loop: login → generate → verify → approve → claim → lock → rate → top-up |
| `backend/test/race-condition.test.ts` | `lock()` and `expire()` fired simultaneously — exactly one wins |
| `backend/test/click-redirect.test.ts` | ClickEvent created + 302 redirect + bot detection |
| `backend/test/admin-override.test.ts` | Override sets `invalidatedAt`, creates `PolicyCheck{override}` |
| `backend/test/distribution-ledger.test.ts` | Anomaly hold + Ledger balance (debits=credits) + Idempotency |

---

## APPENDIX: DESIGN DECISIONS LOG

| Date | Decision | Rationale |
|---|---|---|
| Cycle 1 | Dark-only mode (#0A0F0D) | Premium SaaS feel, no light mode for V1 |
| Cycle 2 | Spring physics (not linear) | Linear feels cheap. Springs feel like native iOS. |
| Cycle 3 | 2D SVG ParrotEye (not 3D) | R3F caused OOM. 2D SVG is lighter and still expressive. |
| Cycle 5d | `useLiveEarnings` shared hook | B17 and WL01 must show identical numbers. Single Zustand selector. |
| Cycle 8 | `useGrowthStore` for viral metrics | K-factor, share rate, invite acceptance tracked separately from main store. |
| Cycle 9 | 4/4 delight interactions | B11 stamp, WL01 confetti, C01 swipe, C04 drag-and-drop |
| Frontend Phase 1 | Dual-mode Zustand (live + demo) | UI works with or without a running backend |
| Frontend Phase 2 | WeekGrid as Calendar-as-Spine | The $499 product. Every screen orbits the weekly calendar. |
| Revenue OS | CampaignStudio 3-phase modal | Justifies premium pricing. Smart Link + Page Editor + ROI Funnel in one flow. |
| Revenue OS | AI Copilot floating pill | Makes the app feel alive and intelligent. Proactive next-best-action. |
| Revenue OS | Skeletons, not spinners | Pulsing glassmorphic skeletons make AI feel fast. Spinners feel like waiting. |

---

**END OF DOCUMENT.**

This file is the living source of truth for the Perokio frontend. Update it on every commit. The Tunisia Pilot depends on it.

🦜 **Perokio — Verified Facts × Local Film.**
