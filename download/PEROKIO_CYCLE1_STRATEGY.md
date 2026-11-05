# PEROKIO — CYCLE 1: RESEARCH & STRATEGY

> Output only. No code in this cycle. Awaiting approval before Cycle 2.

---

## 1. Competitive UI/UX Audit

For each app: **2 specific patterns** relevant to Perokio + **how to adapt them**.

### TikTok — the dopamine reference for C01 / C06 / WL01
- **Pattern A — "Next card already queued."** When a user finishes a video, the next one is already loaded and visually hinted (the bottom of the next card peeks above the fold). The brain never feels the friction of "what now."
  - **Adapt to C01 Facts Wall:** When a creator claims a Hot Drops card, the next Hot Drops card should already be sliding in from the right. Do not return them to the wall to pick again — auto-advance with a "Claimed ✓ — next drop" toast and a peek of the next card.
- **Pattern B — Bio link = onboarding funnel.** The creator's profile URL is the entire acquisition loop. Every creator bio on TikTok points back to a link, and that link is the conversion surface.
  - **Adapt to P03 + P04:** Perokio's public creator profile and public fact page are the equivalent. They must be (a) public (no auth wall), (b) SSR'd for SEO, (c) carry the "Powered by Perokio" badge so the audience knows where to sign up.

### CapCut — the editor reference for C04 / B14
- **Pattern A — Timeline strip = visual scannability, not text.** Each clip is a colored thumbnail with a duration badge. The brain parses 8 clips in 200ms; a list of clip names takes 4s.
  - **Adapt to C04:** The current timeline strip is correct. Extend the same pattern to B09's Content Machine timeline — every video card already shows the emoji thumbnail, but the locked-pending cards should also show a tiny progress dot on the thumbnail itself (not just in the progress bar below).
- **Pattern B — "Templates" as starting points, not blank canvases.** CapCut never shows a blank project. Every project starts from a template.
  - **Adapt to A07 Fact Authoring:** When the Studio creates a fact, they should start from a trend-derived template (the A04 Trend Radar's "Convert to Fact Bundle" already does this). Make the empty state disappear — always pre-fill from the trend.

### BeReal — the scarcity reference (and the cautionary tale)
- **Pattern A — The synchronous timer creates real urgency.** "Time to BeReal. 2 minutes left." The countdown isn't decoration — it changes behavior.
  - **Adapt to C04 + B09:** The 24h lock window and 12h review window are Perokio's "Time to BeReal." They must be **visible on every screen that touches the fact lifecycle**, not just C04. Specifically: B09 Content Machine shows the brand's 12h review bar (already done), but C06 My Prints should show the creator's 24h lock bar on every in-progress print.
- **Pattern B — Late submissions are visibly late.** BeReal marks late posts with a "X hours late" tag. Social pressure, not algorithmic punishment.
  - **Adapt to B12 Video Review:** When a brand reviews a video that was submitted 8h ago (4h left in the 12h window), the review card should show "submitted 8h ago — 4h to auto-approve" with an orange urgency tint. The brand feels the time pressure.
- **The cautionary tale (from research):** BeReal raised $90M, hit #1 on the App Store, and collapsed within 4 years. Root cause per the case studies: **"A Viral Mechanic is Not a Retention Engine."** Their synchronous push created explosive growth, but the core content loop didn't compound — novelty wore off because there was no accumulating value.
  - **Strategic implication for Perokio:** The 24h scarcity window creates the urgency, but the **wallet balance + creator level + portfolio** is what compounds. Cycle 8's viral mechanics must explicitly tie the share loop to the wallet (the "I earned $X on Perokio" card) — NOT to a transient streak. Streaks without compounding payoff are the BeReal trap.

### Lemon8 — the editorial-Commercial blend reference for B10 / C02
- **Pattern A — Hashtag challenges as fact bundles.** Lemon8's challenge pages aggregate creator posts under a single hashtag with a brand sponsor. The brand sponsors the challenge; creators post under it.
  - **Adapt to P04 Public Fact Page:** The /wall/[factId] page is Perokio's equivalent. It aggregates all creator versions of a single fact under the founding brand's logo. This is the SEO asset AND the brand FOMO driver.
- **Pattern B — Editorial layout for creator content.** Lemon8 uses magazine-style layouts (large hero image, smaller grid below) instead of uniform feeds.
  - **Adapt to B10 Fact Library:** The library is a curator's tool, not a hunt. Use a magazine layout — featured fact (large card) on top, smaller grid below. Distinct from C01's masonry.

### Linear — the Studio reference (A01–A07)
- **Pattern A — Cmd+K is global, even inside text fields.** Linear's command palette works mid-sentence in a text area. The shortcut is muscle memory.
  - **Adapt to A07 Fact Authoring:** Cmd+K opens a context-scoped palette: "Save draft / Submit to QA / Add source / Generate script with AI / Insert trend tag." NOT generic navigation. The Studio editor should be operable without a mouse.
- **Pattern B — Status pills with color = semantic state, not decoration.** Linear's issue states (Backlog / In Progress / Done) are color-coded and the color is the state. You don't read the text — you scan the color.
  - **Adapt to A01 + A05:** Every fact/video status already maps to lime/orange/red. Extend to ALL admin tables: pipeline stages, QA items, vetting applicants. The color is the data.

### Notion — the editorial-calm reference for B01–B07 onboarding
- **Pattern A — One block, one decision.** Notion's editor never asks you to fill 7 fields at once. Each block is one decision.
  - **Adapt to B01–B07 Brand Onboarding:** One question per screen. Brand name → industry → budget → first fact → done. NOT a wizard with 7 fields on one page. Each step has a clear "why" sentence. The progress bar is the only chrome.
- **Pattern B — Slash commands for content insertion.** Notion's `/` opens a context menu for inserting blocks.
  - **Adapt to A07:** `/` in the script editor opens "Insert hook / Insert data point / Insert CTA / Insert source link." Keyboard-first authoring.

### Arc Browser — the design-system discipline reference
- **Pattern A — Color as navigation, not as decoration.** Arc uses spaces (each with a color) as the primary navigation metaphor. The color IS the space.
  - **Adapt to role switching:** The brand/creator/admin role switcher already uses lime/orange/red dots. Extend this — every screen's accent should subtly reinforce the active role. (E.g., when in Brand Studio, the sidebar's lime accent bar is present; in Creator, orange; in Admin, red. Currently only the role dot is colored — the sidebar accent should follow.)
- **Pattern B — Split views for parallel workflows.** Arc lets you split the screen into two independent panels.
  - **Adapt to B12 Video Review:** Brand should be able to open two videos side-by-side for comparison. (Probably Cycle 5 stretch goal, not critical.)

---

## 2. Growth Case Study

### Case A — Cash App's `$cashtag` (the share loop template)

**The mechanic:** Cash App assigned every user a public `$cashtag` (e.g., `$sarah`). The cashtag was (a) a URL (`cash.app/$sarah`), (b) printable, (c) shareable in a bio, (d) a payment endpoint. Anyone could send money to anyone with the URL — no friend request, no friction.

**Why it went viral:** The cashtag turned every user into a distribution channel. Each time a creator shared their cashtag on Instagram, they were both (a) collecting payments and (b) recruiting new users to Cash App (the senders had to sign up). The product's growth was a side effect of users promoting themselves.

**The Perokio adaptation:**
- Every creator gets `/creator/[handle]` (e.g., `/creator/amira.tn`). This is the cashtag equivalent.
- Every printed fact gets `/wall/[factId]` (e.g., `/wall/F-2024-1101-01`). This is the brand's cashtag.
- Both URLs are public, SSR'd, and carry an OG card (1200×630) with the creator's stats / the fact's aggregate stats + "Powered by Perokio."
- Every time a creator shares their profile in their TikTok bio, they're both (a) showing social proof and (b) recruiting new creators to Perokio (the audience members who click have to sign up to claim their own facts).
- **The single most important mechanic to copy:** the public URL with social-proof stats. This is the entire Cycle 8 viral engine in one feature.

### Case B — Duolingo's Duo (the mascot-as-growth-engine template)

**The mechanic:** Duo the owl became the brand. He shows up in (a) push notifications (the famous guilt-trip "It's time for your Spanish lesson"), (b) the app icon, (c) celebration animations, (d) social media. He has a recognizable personality: pushy, passive-aggressive, beloved.

**Why it worked:**
1. **The mascot was redesigned for animation.** The 2019 redesign specifically simplified the owl's geometry so it could be animated expressively without breaking the silhouette.
2. **He appears at moments of state change,** not as decoration. He celebrates when you complete a lesson, looks sad when you miss a day. The mascot IS the feedback loop.
3. **He became a meme.** Duo's pushy notifications became a viral meme format. Free distribution.

**The Perokio adaptation (for Cycle 3 — 3D Parrot):**
- The parrot must appear at state transitions, not as ambient decoration. States: Claim (leans forward, nods), Edit (working, scratches head), Lock (hunches, focuses), Publish (arms up, confetti), Success (spin 360°, sparkle), Error (droop, red "!").
- The parrot's geometry must be simple enough to animate expressively. ~3,000 polys, single mesh where possible.
- The parrot should be the app icon AND the loading state AND the celebration. Consistency builds the brand.
- **Anti-pattern to avoid:** the parrot as a homepage hero illustration that doesn't react to user state. That's a SaaS template move. The parrot is a feedback device, not a decoration.

---

## 3. Motion Reference Board

Concrete Framer Motion snippets to lock in for Cycle 2's reusable components.

### TimerBar — reusable countdown with color-shift urgency

```tsx
// Urgency auto-escalates: lime (>3h) → orange (<3h) → red pulse (<1h)
// Uses date-fns for the math, Framer Motion for the visual morph.
const timerVariants = {
  calm:    { color: '#D8EF70', boxShadow: '0 0 0px rgba(216,239,112,0)' },
  urgent:  { color: '#ED7A42', boxShadow: '0 0 12px rgba(237,122,66,0.4)' },
  critical:{ color: '#E5484D', boxShadow: '0 0 16px rgba(229,72,77,0.6)' },
}

<motion.span
  variants={timerVariants}
  animate={secs < 3600 ? 'critical' : secs < 3*3600 ? 'urgent' : 'calm'}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
  className="font-mono tabular-nums"
>
  {formatDuration(secs)}
</motion.span>
```

### AnimatedCTA — hover/press/success morph

```tsx
// The button doesn't just change color on click — it morphs.
// Hover: subtle lift + lime glow. Press: scale down + brief shake.
// Success: the label swaps to "✓ Done" and the bg pulses lime.
const ctaVariants = {
  rest:    { scale: 1,    backgroundColor: '#D8EF70', color: '#0A0F0D' },
  hover:   { scale: 1.02, boxShadow: '0 0 24px rgba(216,239,112,0.5)' },
  press:   { scale: 0.97 },
  success: { backgroundColor: '#D8EF70', color: '#0A0F0D', transition: { duration: 0.4 } },
}

<motion.button
  variants={ctaVariants}
  initial="rest"
  whileHover="hover"
  whileTap="press"
  animate={justSucceeded ? 'success' : 'rest'}
>
  {justSucceeded ? '✓ Locked' : 'Lock Video & Submit'}
</motion.button>
```

### Spring curves (locked into the design system per §6)

```ts
// springs.ts — shared motion config
export const springSoft   = { type: 'spring', stiffness: 120, damping: 20 } // state changes
export const springSnappy = { type: 'spring', stiffness: 300, damping: 25 } // microinteractions
export const easeEditorial = [0.22, 0.61, 0.36, 1] as const                // entrances
```

---

## 4. 3D Parrot Reference Research

### Reference mascots — what works

| Mascot | Why it works | Perokio takeaway |
|---|---|---|
| **Duolingo Duo** | Redesigned in 2019 specifically to be animatable — simplified silhouette, expressive eyes, single-color body. Personality > detail. | The parrot needs ONE signature silhouette and ONE signature expression (the blink). Resist adding feather detail. |
| **Cash App's mascot** (the square) | Minimal geometry, but the brand color IS the mascot. The "character" is the money. | The parrot's lime/orange palette IS the brand. Don't add new colors for the parrot. |
| **Mozilla's dino** | Low-poly, runs on a tight frame budget (the offline game). Proves that <3000 polys + flat shading can carry personality. | Use flat shading / ToonMaterial, not PBR. Cheaper to render, looks intentional. |
| **GitHub Octocat** | Static 2D most of the time, animated only for celebrations. The mascot doesn't need to be everywhere. | The parrot shouldn't be on every screen. Only on screens where state changes: C04 lock, B12 approve, WL01 payout. |
| **Notion's loading dots** | Not a mascot, but a personality moment. Three bouncing dots, ~50ms apart. The "personality" is the timing, not the visual. | The parrot's blink timing (every 3-5s, randomized) is the personality. Not the model detail. |

### Performance research — concrete findings

From R3F docs (search result [turn0search0]):
- **R3F has a native `performance` API** that adaptively downscales quality when FPS drops. Set `performance={{ min: 0.5 }}` on the Canvas — when FPS falls below a threshold, R3F calls a `callback` that you can use to swap to a lower-poly model or disable effects.
- **The recommended pattern:** use `<Adaptive DPR>` (PixelRatio scales with performance) and `<Adaptive Events>` (disable raycasting on slow devices).

From mobile deep-dive (search result [turn0search2]):
- **Instanced meshes** for any repeated geometry (confetti particles, sparkle bursts). Don't create N separate meshes for N particles.
- **Draco compression** for the GLTF — reduces transfer size by ~90%. Target: <500KB total for the parrot.
- **Dispose geometries/materials on unmount** — WebGL contexts leak if you don't. Use `<Canvas onCreated={({ gl }) => { /* store gl ref */ }}>` and call `gl.dispose()` in the cleanup.

### Concrete plan for Cycle 3

1. **Model:** ~2,800 polys, single mesh body, separate beak + eye meshes for animation. ToonMaterial with lime body + orange beak. No PBR textures.
2. **Animation clips:** Idle (breathing + blink), Claim (lean + nod), Lock (hunch), Publish (arms up + confetti instanced), Success (360° spin + sparkle), Error (droop + red "!").
3. **Loading:** IntersectionObserver on the parent container. `<Suspense fallback={<ParrotEyeFallback />}>` — the current 2D SVG eye is the fallback.
4. **Performance scaling:** `<Canvas performance={{ min: 0.5 }}>` + `<Adaptive DPR pixelratio={[1, 2]}>`. If FPS < 45 for 1s, swap to a 1,200-poly LOD model.
5. **Failure path:** If WebGL context creation throws, immediately render the 2D SVG eye. No retries.
6. **prefers-reduced-motion:** Always render the 2D SVG eye. No 3D at all.

### Performance budget (target)

| Device | Target FPS | Strategy |
|---|---|---|
| iPhone 12 / Galaxy S21 | 60fps | Full 3D, 2,800 polys, instanced confetti |
| iPhone SE / mid-range Android | 45fps | 3D with adaptive DPR, 1,200-poly LOD |
| Old devices / WebGL fail | N/A | 2D SVG fallback |
| prefers-reduced-motion | N/A | 2D SVG fallback |

---

## 5. Design Rationale — One-Pager for the Remaining 38 Screens

This is the strategic doc. Per screen group: what changes, what stays, what gets deleted.

### P01–P04 — Public Surface (the viral entry point)

- **P01 Landing — sell the hustle, not the platform.** NO feature grid. NO "trusted by" logos. NO "🚀 Get started" hero. Instead: a real creator's wallet screenshot (from mock data — Amira's $1,840 total earned) with the line "Amira earned this in 38 videos. She started 4 months ago." CTA: "Start earning in 24h." Below the fold: 3 real printed facts with their view counts. The proof IS the product.
- **P02 Login — friction is the enemy.** Apple + Google + magic-link email. No password field on first screen. If a user has to think about whether they have an account, you've lost them.
- **P03 Public Creator Profile (`/creator/[handle]`)** — SSR'd, no auth wall. Shows: name, level badge, top 3 stats (Prints, Total Views, Total Earned), streak counter (only if active), top 3 print thumbnails. Footer badge: "Powered by Perokio." OG card 1200×630 with the same data. This is the cashtag.
- **P04 Public Fact Page (`/wall/[factId]`)** — SSR'd. Shows: fact text (the verified claim), founding brand logo, total creator count, total aggregated views, list of all creator versions (thumbnail + creator name + their view count). Footer badge: "Made with Perokio." This is the SEO asset. Every fact that goes PRINTED gets a public URL.

### B01–B07 — Brand Onboarding (editorial calm)

- **One question per screen.** Not a wizard with 7 fields. Each step: one decision, one "why" sentence, one progress bar at top. Whitespace dominates. Single typeface accent (Fraunces for the question, Inter for everything else).
- **B01 Welcome** → **B02 Brand identity** → **B03 Industry & audience** → **B04 Budget & tier** → **B05 First fact (from trend templates)** → **B06 Wallet top-up** → **B07 First claim invitation.**
- No celebration animations until B07. The brand is here to do work, not to be entertained.

### B10 — Fact Library (curator's tool, distinct from C01)

- Magazine layout: featured fact (large card) on top, smaller grid below.
- Filters: tier (Hot/Premium/Standard), status (draft/funded/live/claimed/locked/printed/paid), brand, language.
- Uses the new `FactCard` component.
- Distinct from C01: this is the brand's library of their OWN facts. C01 is the creator's hunt for ANY brand's facts.

### B12 — Video Review (single-focus, time-pressured)

- One video at a time. Full attention. 9:16 preview frame dominates.
- Top: 12h shrinking review bar (orange → red as it depletes). "Submitted Xh ago — Yh to auto-approve."
- Below: locked script (from B11), source chips per line.
- Feedback textarea (required if rejecting).
- Two CTAs: Approve (lime) / Request changes (orange). Both morph on click (AnimatedCTA component).
- The parrot appears here on Approve — throws arms up, confetti burst (1s max).

### B13 — Claim Feed (live activity stream)

- Slack-channel-style live feed of who claimed what, when.
- Each entry: `[avatar] @handle claimed F-2024-1101-01 · 2h ago · [view fact →]`
- Real-time updates (simulated). Used by brands to feel momentum (the Brand FOMO loop).

### B14 — Video Review Detail (deep-dive)

- Single video, full breakdown: script line-by-line with timestamps, asset usage, creator's edit history, view curve over 24h.
- Brand's analytical view, not the review view.

### B15 — Posting Queue (calendar)

- Scheduled posts via Postiz. Calendar view (week / month).
- Each slot shows: fact code, creator, platform, scheduled time, expected payout.
- Drag to reschedule.

### B16 — Assisted Post (brand boost)

- When a creator's video underperforms (<50% of view cap in first 12h), brand can "assist" — boost the post via paid TikTok/IG ads.
- Toggle: "Auto-assist underperforming videos above $X CPM threshold."

### B17 — Results (per-video analytics)

- Views over time (24h area chart).
- Earnings breakdown: Base + CPM.
- Comparison to brand average.
- "What worked / what didn't" auto-summary (mock AI).

### B18 — Next Cycle (recommendation engine)

- "Fund your next fact based on trends." Pulls from A04 Trend Radar.
- Each recommendation: trend keyword + velocity + suggested base fee + projected CPM.
- One-click "Create fact from this trend."

### B19 — Billing

- Invoice-style. Monthly spend breakdown.
- Subscription + CPM spend + video credits used + extra credits.
- Stripe-style transaction list.
- Top-up CTA.

### B20 — Settings

- Brand account, team members, API keys (for Postiz integration), notification preferences.
- Standard settings, no surprises.

### C02 — Fact Detail (creator's view of a fact before claiming)

- Full fact text, full script preview (locked), source list, previous creator versions (thumbnails + view counts).
- Claim CTA: "Claim · 24h to lock" (uses AnimatedCTA).
- After claim → C03.

### C03 — Claim Confirmation (celebration)

- Full-screen celebration. Parrot spins 360° + sparkle burst (2s max).
- "You have 24 hours." Big countdown.
- "Go to editor →" CTA.
- This is the dopamine moment. Make it feel earned.

### C05 — Lock Confirmation (relief, not celebration)

- "Submitted. Brand will reply within 12h."
- Calmer than C03. Parrot hunches (the Lock state).
- "Back to Facts Wall" + "View in My Prints" CTAs.

### C06 — My Prints (creator portfolio)

- Grid of all the creator's prints (claimed, in-edit, locked, printed, paid).
- Each card: thumbnail, fact code, status pill (color-coded), views, earnings.
- Filter: status / date / brand.
- The 24h lock bar shows on any in-progress print.

### C07 — Profile Editor

- Edit name, handle, avatar, bio, social links.
- **Live OG card preview** (1200×630) updates as they type.
- "Powered by Perokio" badge in the preview (always on, not removable).
- Save → toast.

### C08 — Settings (creator)

- Payout method (Flouci), notification preferences, language (EN/ع), account deletion.
- Standard.

### A01–A07 — Studio (Cmd+K + keyboard-first)

- **A01 Brand Pipeline** — Kanban (lead/demo/pilot/active/churned) with MRR KPIs. Color-coded. Drag between stages.
- **A02 Creator Vetting** — Applicant cards with sample links, 3 vetting checks (content policy / audience quality / posting cadence), approve/reject. Keyboard shortcuts: A=approve, R=reject, J/K=next/prev.
- **A03 Script QA** — Queue with verification completion %. Cross-link to B11.
- **A04 Trend Input** — Trend radar (TikTok/IG/YT), velocity/volume, "Convert to Fact Bundle" CTA.
- **A05 Wall Monitor** — Live KPIs, wall facts with claimer avatar stacks, B11 lock counts, platform health checks.
- **A06 Quality Dashboard** — Aggregated QA metrics: avg verification time, source diversity, rejection rate by reason.
- **A07 Fact Authoring** — Keyboard-first. Cmd+K palette. Slash commands in script editor. Three-pane: sources (left), script (center), preview (right). The Studio editor's home.

### Cross-cutting concerns

- **Cmd+K palette** lives in a Studio-level context provider. Available on every admin screen. Scoped commands per screen.
- **prefers-reduced-motion** — every Framer Motion component checks this and falls back to instant transitions.
- **Watermarking** — Cycle 8. Every video exported from Hyperframe has a subtle Perokio mark (4% of frame height, bottom-left, 40% opacity). The flywheel.

---

## Cycle 1 Summary

- **Competitive audit done.** 7 apps, 14 patterns, all adapted to specific Perokio screens.
- **Growth case study done.** Cash App cashtag = the share loop template. Duolingo Duo = the mascot-as-feedback template. BeReal = the cautionary tale (urgency without compounding value fails).
- **Motion reference done.** TimerBar + AnimatedCTA snippets locked. Spring curves defined.
- **3D parrot research done.** 2,800-polys target, ToonMaterial, IntersectionObserver + Suspense + 2D fallback. Performance budget by device class.
- **Design rationale done.** 38 screens grouped into 7 categories, each with a specific plan that respects the locked design system and the locked E2E flow.

**No code written.** No screens touched. Awaiting approval to proceed to Cycle 2.

---

## Verification (Cycle 1 — no code)

```
$ bun run lint
$ eslint .   # 0 errors, 0 warnings (no code changed)

$ curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
200   # dev server still running, E2E flow intact
```

## Blockers

1. **The 3D parrot model itself.** I cannot generate a GLTF file from text. Three options:
   - **(Recommended) Build the parrot procedurally with R3F primitives** (spheres, cones, custom geometries) — gives me full control over the ~2,800-poly budget, no external asset dependency, instant iteration. The "model" is a TypeScript file that constructs the mesh tree.
   - Use a free low-poly parrot from Sketchfab (CC-licensed) — risks style mismatch with the locked palette, requires manual color remapping.
   - Commission a model — out of scope for this cycle.
   - **My recommendation:** procedural R3F construction. It's the only option that guarantees palette compliance and lets me tune polys precisely.

2. **OG card generation.** For P03 + P04, the OG cards need to be server-rendered images (1200×630). Three options:
   - **(Recommended) `next/og` ImageResponse** — built into Next.js 16, generates OG images at request time, no external service. Uses the same Tailwind tokens.
   - Pre-generate static PNGs at build time — works for creator profiles but not for live stats.
   - Use a third-party service (Cloudinary, Vercel OG) — adds a dependency.
   - **My recommendation:** `next/og` ImageResponse. Native, SSR'd, no new dep.

3. **Watermarking implementation.** For Cycle 8, the watermark needs to be on every video exported from Hyperframe. Three options:
   - **(Recommended) SVG overlay on the 9:16 frame** — for the demo, the "export" is a screenshot of the C04 preview frame with the watermark SVG baked in. The watermark is a `<svg>` element positioned bottom-left at 4% frame height, 40% opacity. No actual video processing needed for the demo.
   - Server-side video processing with FFmpeg — out of scope for a UI demo.
   - Client-side canvas compositing — possible but overkill for a demo.
   - **My recommendation:** SVG overlay. It demonstrates the intent without claiming to do real video encoding.

## Next cycle preview

Cycle 2: Design System Extensions — add the motion curves, elevation tokens, TimerBar, AnimatedCTA, FactCard, ShareCardPreview components, wire them into B12 as proof of concept, and add `prefers-reduced-motion` support everywhere.
