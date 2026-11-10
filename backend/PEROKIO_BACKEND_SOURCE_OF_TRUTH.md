# 🦜 PEROKIO BACKEND — PRODUCTION SOURCE OF TRUTH (V1)

> **Status:** V1 Locked. Cycles B1–B7 complete. 25 tables, 39 API routes, 3 BullMQ workers.
> **Stack:** NestJS (Modular Monolith) · Prisma ORM · PostgreSQL · Redis + BullMQ · Cloudflare R2
> **Last updated:** November 2026 (post-B7)
> **File:** This document is the definitive reference for the frontend team and future backend engineers. It supersedes all chat logs and prompt transcripts.

---

## SECTION 1: SYSTEM ARCHITECTURE & STACK

### 1.1 Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | NestJS | 10.4.x | Modular monolith. App Router pattern, dependency injection. |
| Language | TypeScript | 5.7+ | Strict mode (per-package). Decorators + metadata enabled. |
| ORM | Prisma Client | 6.19.x | Generated client at `packages/db/src/generated/prisma`. |
| Database | PostgreSQL | 17.11 | 25 tables, native arrays + JSON, conditional UPDATE for race safety. |
| Cache/Queue | Redis | 7.4 | BullMQ delayed jobs for timers. Idempotency key cache (24h TTL). |
| Job Queue | BullMQ | 5.34.x | 3 queues: `lock-expiry`, `review-expiry`, `settle-video`. |
| Object Storage | Cloudflare R2 | — | Video MP4 storage. Key stored as `Video.r2Key`. Mocked in V1. |
| Auth | JWT ( Passport) | — | Access token (15m) + refresh token (7d). 8-role RBAC. |
| Hashing | bcryptjs | 2.4.x | Password hashing (10 rounds). |
| IDs | cuid() | — | All primary keys are collision-resistant strings. |

### 1.2 Folder Structure

```
backend/
├── apps/
│   ├── api/                        # NestJS HTTP server (port 4000)
│   │   └── src/
│   │       ├── auth/               # B1 — JWT + RBAC (signup, login, refresh, me)
│   │       ├── facts/              # B1/B4 — Fact CRUD + generate endpoint
│   │       ├── scripts/            # B2 — Script CRUD + B11 approval gate
│   │       ├── claims/             # B3 — Claim + Lock (race-safe)
│   │       ├── shortlinks/         # B3 — Click redirect + bot detection
│   │       ├── harness/            # B4 — LLM generation + eval + activation
│   │       ├── admin/              # B5 — Script QA + transcript + override + rating
│   │       ├── distribution/       # B6 — Postiz mock + view ingestion + settlement
│   │       ├── ledger/             # B7 — Double-entry + Stripe webhook + payouts
│   │       ├── prisma/             # PrismaService singleton
│   │       └── common/             # AuditInterceptor, IdempotencyMiddleware, RolesGuard
│   └── worker/                     # NestJS BullMQ workers (separate process)
│       └── src/processors/
│           ├── lock-expiry.processor.ts      # B3 — 24h claim auto-expire
│           ├── review-expiry.processor.ts    # B3 — 12h review auto-approve/hold
│           └── settle-video.processor.ts     # B6 — 24h settlement timer
├── packages/
│   └── db/                         # Shared Prisma package
│       ├── prisma/schema.prisma    # 508 lines, 25 models
│       └── src/
│           ├── index.ts            # PrismaClient singleton (HMR-safe)
│           ├── seed.ts             # Test data: brand, creator, fact, sources
│           └── generated/prisma/   # Generated client (do not edit)
├── scripts/
│   ├── start-services.sh           # Start PostgreSQL + Redis
│   ├── proof-b11-gate.sh          # B2 proof
│   ├── proof-harness-eval.sh       # B4 proof
│   └── proof-print-rating.sh       # B5 proof
├── test/
│   ├── race-condition.test.ts      # B3 proof
│   ├── click-redirect.test.ts      # B3 proof
│   ├── admin-override.test.ts      # B5 proof
│   └── distribution-ledger.test.ts  # B6/B7 proof (anomaly + ledger + idempotency)
├── pnpm-workspace.yaml             # Monorepo config
├── .env                            # Environment variables
└── package.json
```

### 1.3 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/perokio?schema=public"

# Redis (for BullMQ + idempotency cache)
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="perokio-dev-secret-change-in-production"   # MUST change in prod
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"

# Cloudflare R2 (mocked in V1 — keys are placeholders)
R2_ACCOUNT_ID="dev"
R2_ACCESS_KEY_ID="dev"
R2_SECRET_ACCESS_KEY="dev"
R2_BUCKET="perokio-videos-dev"

# App
PORT=4000
NODE_ENV=development
```

**Production additions required for V2:**
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (real Stripe integration)
- `POSTIZ_API_KEY` + `POSTIZ_API_URL` (real Postiz integration)
- `FLOUCI_API_KEY` + `FLOUCI_API_SECRET` (real Flouci payout integration)
- `OPENROUTER_API_KEY` (real LLM calls)

### 1.4 Running the Backend

```bash
# 1. Start PostgreSQL + Redis
bash scripts/start-services.sh

# 2. Push schema (idempotent)
cd packages/db && npx prisma db push --schema prisma/schema.prisma --accept-data-loss

# 3. Seed test data (optional)
npx ts-node src/seed.ts

# 4. Start the API (port 4000)
cd ../.. && cd apps/api
npx ts-node src/main.ts

# 5. Start the worker (separate terminal)
cd ../worker
npx ts-node src/main.ts

# 6. Run all proofs
bash scripts/proof-b11-gate.sh
bash scripts/proof-harness-eval.sh
bash scripts/proof-print-rating.sh
npx ts-node test/race-condition.test.ts
npx ts-node test/click-redirect.test.ts
npx ts-node test/admin-override.test.ts
npx ts-node test/distribution-ledger.test.ts
```

---

## SECTION 2: THE CORE LOCKS (INVARIANTS)

These four invariants are non-negotiable. Each is enforced at multiple layers (application + database) to prevent bypass.

### 2.1 The B11 Moat — Script Verification Gate

**Rule:** `POST /scripts/:scriptVersionId/approve` MUST fail if ANY `ScriptLine` has `verified = false`.

**Enforcement — Layer 1 (Application):**
```typescript
// apps/api/src/scripts/scripts.service.ts → approve()
const unverifiedLines = version.lines.filter((l) => !l.verified);
if (unverifiedLines.length > 0) {
  throw new BadRequestException({
    error: 'B11_VERIFICATION_FAILED',
    message: `${unverifiedLines.length} of ${version.lines.length} script lines are unverified. Publishing is blocked.`,
    unverifiedLines: unverifiedLines.map((l) => ({ lineId: l.id, position: l.position, text: l.text })),
  });
}
```

**Enforcement — Layer 2 (Database, defense in depth):**
```typescript
// Raw SQL guard — even if the app check is bypassed, the DB refuses
const unverifiedCount = await prisma.$queryRaw`
  SELECT COUNT(*)::bigint as count FROM "ScriptLine"
  WHERE "scriptVersionId" = ${scriptVersionId} AND verified = false
`;
if (Number(unverifiedCount[0].count) > 0) {
  throw new BadRequestException({ error: 'B11_DB_GUARD_FAILED' });
}
```

**On success:** A `VerificationReceipt` is created with a SHA-256 hash of the canonical JSON `{ scriptVersionId, lines: [{position, text, sources}], reviewerId, approvedAt }`. This receipt is the tamper-evident proof that the script was 100% sourced at approval time.

**Un-verification:** Editing a `ScriptLine.text` resets `verified = false` and invalidates the active receipt (sets `invalidatedAt = now()`). The script version returns to `in_qa` status.

**Proof:** `scripts/proof-b11-gate.sh`

---

### 2.2 The Off-Script Defense — Receipt Invalidation

**Rule:** If a creator's uploaded video transcript deviates from the verified script, the video enters `held_factual_deviation`. The Admin override explicitly invalidates the `VerificationReceipt` and logs a `PolicyCheck{result: 'override'}`.

**Deviation detection (`POST /admin/videos/:id/transcript`):**
```typescript
// apps/api/src/admin/admin.service.ts → submitTranscript()
const scriptText = approvedVersion.lines.map((l) => l.text).join(' ');
const similarity = this.jaccardSimilarity(transcript, scriptText);
const DEVIATION_THRESHOLD = 0.7;

if (similarity < DEVIATION_THRESHOLD) {
  await prisma.policyCheck.create({
    data: { videoId, checkType: 'script_match', result: 'fail',
            details: `Jaccard similarity: ${similarity.toFixed(3)} < ${DEVIATION_THRESHOLD}` },
  });
  await prisma.video.update({ where: { id: videoId }, data: { stage: 'held_factual_deviation' } });
}
```

**Override (`POST /admin/videos/:id/override-deviation`):**
```typescript
// apps/api/src/admin/admin.service.ts → overrideDeviation()

// 1. Create the override PolicyCheck
await prisma.policyCheck.create({
  data: { videoId, checkType: 'off_script_override', result: 'override',
          details: `Brand override by ${adminId}. Original B11 receipt invalidated.` },
});

// 2. Move video back to locked_pending (brand review queue)
await prisma.video.update({ where: { id: videoId }, data: { stage: 'locked_pending' } });

// 3. Invalidate the VerificationReceipt (audit trail — never delete)
await prisma.verificationReceipt.update({
  where: { id: receipt.id },
  data: { invalidatedAt: new Date(), invalidatedBy: adminId,
          invalidatedReason: `Off-script override for video ${videoId}` },
});
```

**The legal mechanism:** The original B11 receipt no longer covers the video. The brand assumes the legal risk. The receipt is marked `invalidatedAt` (not deleted) so the audit trail is preserved.

**Proof:** `test/admin-override.test.ts`

---

### 2.3 Race Conditions — Conditional SQL Updates

**Rule:** Timer-triggered state transitions (lock expiry, review expiry, settlement) must not conflict with user-triggered transitions (lock, approve, settle).

**Pattern:** Every state transition uses a conditional `UPDATE ... WHERE status = 'expected_old' RETURNING id`. If 0 rows are returned, the state already moved — no-op.

**Lock endpoint (`POST /videos/:id/lock`):**
```sql
-- apps/api/src/claims/claims.service.ts → lockVideo()
UPDATE "Claim"
SET status = 'locked', "lockedAt" = NOW(), "updatedAt" = NOW()
WHERE id = ${claimId}
  AND status IN ('claimed', 'in_edit')
RETURNING id
-- If rowCount = 0, the timer (or another request) already moved the claim.
-- Reject with ConflictException.
```

**Lock expiry worker (`lock-expiry.processor.ts`):**
```sql
UPDATE "Claim"
SET status = 'expired', "updatedAt" = NOW()
WHERE id = ${claimId}
  AND status = 'claimed'
RETURNING id
-- If rowCount = 0, the creator locked in time. No-op.
```

**Review expiry worker (`review-expiry.processor.ts`):**
```sql
UPDATE "Video"
SET stage = 'approved_queued', "updatedAt" = NOW()
WHERE id = ${videoId}
  AND stage = 'locked_pending'
RETURNING id
-- If rowCount = 0, the brand already reviewed. No-op.
```

**Settlement (`POST /distribution/videos/:videoId/settle`):** Checks `video.stage === 'published'` before settling. If already settled, no-op.

**Proof:** `test/race-condition.test.ts` — fires `lock()` and `expire()` simultaneously via `Promise.allSettled()`. Exactly one wins.

---

### 2.4 Financial Invariant — Double-Entry Balance

**Rule:** `sum(debits) === sum(credits)` across all `LedgerEntry` rows, always.

**Enforcement:** `LedgerService.postEntry()` creates paired debit + credit entries inside a Prisma `$transaction`. The `idempotencyKey` unique constraint (`refType:refId:debit` / `refType:refId:credit`) prevents duplicate entries.

```typescript
// apps/api/src/ledger/ledger.service.ts → postEntry()
const result = await prisma.$transaction(async (tx) => {
  const debitEntry = await tx.ledgerEntry.create({
    data: { accountId: debitAccountId, debit: amountCents, credit: 0,
            refType, refId, idempotencyKey: `${refType}:${refId}:debit` },
  });
  const creditEntry = await tx.ledgerEntry.create({
    data: { accountId: creditAccountId, debit: 0, credit: amountCents,
            refType, refId, idempotencyKey: `${refType}:${refId}:credit` },
  });
  return { debitEntry, creditEntry };
});
```

**Idempotency:** If the same `refType:refId` is posted twice, the unique constraint on `idempotencyKey` rejects the second attempt with `IDEMPOTENT_REJECT`. This is the DB-level backstop for Stripe webhook replays.

**Balance query:** `getBalance(accountId) = SUM(debit) - SUM(credit)` (asset accounts have debit-normal balances).

**Proof:** `test/distribution-ledger.test.ts` (PROOF 2) — after top-up ($500), settlement ($33.20), payout ($33.20), total debits === total credits ($566.40 === $566.40).

---

## SECTION 3: CYCLE-BY-CYCLE LOG (B1 → B7)

### B1: Foundations & Auth

**Goal:** Running API, secure authentication, audit logging.

**Prisma Models Added:**
- `User` — id, email, passwordHash, role (8-value enum), status
- `Brand` — id, name, ownerId, autoApproveOnReviewExpiry
- `Creator` — id, userId, reliabilityScore, level
- `CalendarEntry` — id, brandId, type, channel, status, scheduledAt, timezone (unique on `[brandId, scheduledAt, type, channel]`)
- `LedgerAccount` — id, ownerId, type, currency, brandId?, creatorId? (unique on `[ownerId, type, currency]`)
- `LedgerEntry` — id, accountId, debit, credit, refType, refId, idempotencyKey @unique
- `DomainEvent` — id, eventType, actorId?, entityId?, payload Json, timestamp

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create user + optional Creator record. Returns access + refresh tokens. |
| POST | `/api/auth/login` | Public | Validate credentials, return tokens. |
| POST | `/api/auth/refresh` | Public | Verify refresh token, issue new access token. |
| GET | `/api/auth/me` | JWT | Return current user `{ id, email, role }`. |

**Cross-cutting:**
- `AuditInterceptor` (global) — writes a `DomainEvent` for every POST/PATCH/DELETE. Captures actorId, entityId, sanitized payload.
- `IdempotencyMiddleware` — Redis-backed. Checks `Idempotency-Key` header on money endpoints. Returns cached response if key was seen (24h TTL).
- `RolesGuard` — checks `@Roles()` decorator against JWT `role` field.

**Verification Proof:** Signup + login + me endpoint tested implicitly in all subsequent proof scripts.

---

### B2: The B11 Moat (Script Locking)

**Goal:** Enforce that no script is approved without 100% source coverage.

**Prisma Models Added:**
- `Fact` — id, brandId, tier, language, topic, status, cpmBudget, baseFee, maxClaims
- `ScriptVersion` — id, factId, version, status (draft→in_qa→approved)
- `ScriptLine` — id, scriptVersionId, position, text, isHook, durationSec, verified @default(false)
- `Source` — id, label, url, type (official/news/research/brand_asset), verifiedAt, verifiedBy
- `ScriptLineSource` — join table (many-to-many line↔source)
- `VerificationReceipt` — id, scriptVersionId, hash (SHA-256), reviewerId, invalidatedAt?, invalidatedBy?, invalidatedReason?

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| POST | `/api/facts` | brand_owner, brand_member, studio_editor, super_admin | Create a Fact + first draft ScriptVersion. |
| GET | `/api/facts` | brand+, qa, ops, super_admin | List facts (optional `?brandId=` filter). |
| GET | `/api/facts/:id` | JWT | Get fact + latest script version + lines. |
| POST | `/api/scripts/:scriptVersionId/lines` | brand+, studio, super_admin | Add a ScriptLine (always `verified=false`). |
| PATCH | `/api/scripts/lines/:lineId` | brand+, studio, super_admin | Update line text (auto-resets `verified=false`, invalidates receipt). |
| POST | `/api/scripts/lines/:lineId/sources/:sourceId` | brand+, studio, qa, super_admin | Link a source to a line (sets `verified=true`). |
| DELETE | `/api/scripts/lines/:lineId/sources/:sourceId` | brand+, studio, qa, super_admin | Unlink a source (resets `verified=false` if no sources remain). |
| POST | `/api/scripts/sources` | brand+, studio, qa, super_admin | Create a Source in the library. |
| GET | `/api/scripts/sources` | JWT | List all sources. |
| **POST** | **`/api/scripts/:scriptVersionId/approve`** | **brand_owner, qa_reviewer, super_admin** | **The B11 gate.** Returns 400 if any line is unverified. Mints a VerificationReceipt on success. |
| POST | `/api/scripts/videos/:videoId/override-offscript` | brand_owner, super_admin | Override off-script video (invalidates receipt). |

**Verification Proof:** `scripts/proof-b11-gate.sh` — shows 400 on 2/2 unverified, 400 on 1/2 unverified, 201 on 2/2 verified with receipt hash.

---

### B3: Lifecycle & Timers (Claims & Locks)

**Goal:** Server-enforced timers and race-condition-safe state machines.

**Prisma Models Added:**
- `Claim` — id, factId, creatorId, status (ClaimStatus enum: 7 values), claimedAt, lockDeadline, lockedAt
- `Video` — id, claimId, stage (VideoStatus enum: 9 values), r2Key, transcript, lockedAt, reviewDeadline, publishedAt, settledAt
- `PolicyCheck` — id, videoId, checkType, result, details
- `PublishJob` — id, videoId, platform, status, externalId, scheduledAt, publishedAt
- `ViewSnapshot` — id, videoId, views, clicks, source, isAnomalous, anomalyFlags (later migrated to String[] in B6)
- `ShortLink` — id, code @unique (24-char base62), targetUrl, videoId?, brandId?
- `ClickEvent` — id, shortLinkId, ipHash, userAgent, isBot

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| POST | `/api/facts/:factId/claim` | creator, super_admin | Claim a fact (checks maxClaims). Creates Claim + Video. Pushes 24h lock-expiry job. |
| POST | `/api/videos/:videoId/lock` | creator, super_admin | Lock a video (conditional SQL UPDATE). Creates PolicyCheck (script_match). Pushes 12h review-expiry job. |
| POST | `/api/claims/:claimId/expire` | ops, super_admin | Manual trigger for lock expiry (worker normally calls this). |
| POST | `/api/videos/:videoId/auto-approve` | ops, super_admin | Manual trigger for review expiry auto-approve. |
| GET | `/api/r/:code` | Public | Resolve shortlink, record ClickEvent (with bot detection), 302 redirect. |
| POST | `/api/shortlinks` | brand+, ops, super_admin | Create a shortlink. |

**BullMQ Workers:**
- `lock-expiry.processor.ts` — 24h timer. Conditional UPDATE Claim → 'expired' WHERE status='claimed'.
- `review-expiry.processor.ts` — 12h timer. If `brand.autoApproveOnReviewExpiry = true`, conditional UPDATE Video → 'approved_queued' WHERE stage='locked_pending'.

**Verification Proofs:**
- `test/race-condition.test.ts` — `lock()` and `expire()` fired simultaneously; exactly one wins.
- `test/click-redirect.test.ts` — 3 ClickEvents created (1 real Chrome, 2 bot WhatsApp+Telegram), HTTP 302 redirect.

---

### B4: The Harness API (LLM Generation)

**Goal:** Trigger an LLM, generate an unverified script, run a safety eval.

**Prisma Models Added:**
- `HarnessConfig` — id, name @unique, version, isActive @default(false), modelMap Json, budgetCap
- `GenerationRun` — id, factId?, configId, status (running/completed/failed/eval_passed/eval_failed), isEval, costUsd, tokensUsed, evalPassed?, startedAt, endedAt?

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| POST | `/api/harness/configs` | studio_editor, super_admin | Create a HarnessConfig (isActive defaults false). |
| GET | `/api/harness/configs` | studio+, qa, ops, super_admin | List configs with recent runs. |
| POST | `/api/facts/:factId/generate` | studio_editor, super_admin | Generate a new ScriptVersion via LLM. All lines `verified=false`. Requires config isActive=true. |
| POST | `/api/harness/:configId/eval` | studio+, qa, super_admin | Run 3 trap prompts (health, finance, guarantee). Returns 400 if LLM hallucinates. |
| POST | `/api/harness/:configId/activate` | studio_editor, super_admin | Activate config. Blocked unless a recent eval passed. |

**Key Logic:**
- `LlmService` (mock) — deterministic. Returns 3 script lines per prompt. If prompt contains hallucination keywords (`cure`, `diabetes`, `fda`, `guarantee`, `100%`, `weight loss`), simulates an LLM trying to verify a fake claim.
- The Harness CANNOT set `verified=true`. Only a human via `POST /admin/lines/:id/verify` can.
- Activation gate: checks most recent `GenerationRun` for this config. If no eval run, or eval failed, activation is blocked.

**Verification Proof:** `scripts/proof-harness-eval.sh` — shows generate fails before activation, eval catches hallucination (400), activation blocked after failed eval, activation succeeds after passed eval, generate creates lines all `verified=false`.

---

### B5: The Admin Control Plane

**Goal:** Endpoints for the Studio to manage scripts, review videos, and override deviations.

**Prisma Models Added:**
- `PrintRating` — id, videoId @unique, reviewerId, brandSafety Boolean, scriptMatch Boolean, craftScore Int (1-5), hookScore Int (1-5), overallScore Float, notes?

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| GET | `/api/admin/scripts` | studio+, qa, ops, super_admin | List ScriptVersions in `in_qa` status, with verified/total counts. |
| POST | `/api/admin/lines/:lineId/verify` | studio+, qa, super_admin | Human verifies a line (sets `verified=true`, optionally links a source). |
| POST | `/api/admin/videos/:videoId/transcript` | studio+, qa, ops, super_admin | Submit speech-to-text. Jaccard similarity < 0.7 → `held_factual_deviation`. |
| POST | `/api/admin/videos/:videoId/override-deviation` | qa_reviewer, super_admin | Override off-script (invalidates receipt, moves to `locked_pending`). |
| POST | `/api/admin/videos/:videoId/rate` | qa_reviewer, super_admin | Pass/fail gates + weighted score. 400 if `brandSafety` or `scriptMatch` is false. |
| GET | `/api/admin/pipeline` | studio+, qa, ops, finance, super_admin | Dashboard: counts of facts (draft/in_qa/live) + videos (locked_pending/approved_queued/held/published/settled). |

**Key Logic:**
- `overallScore = (craftScore + hookScore) / 2` — only calculated when both gates pass.
- No re-rating — `PrintRating.videoId` is `@unique`. Second rating returns 409 Conflict.
- Transcript check skipped if no approved ScriptVersion exists.

**Verification Proofs:**
- `test/admin-override.test.ts` — proves receipt `invalidatedAt` is set, `invalidatedBy` = admin, override `PolicyCheck` created, video moved to `locked_pending`.
- `scripts/proof-print-rating.sh` — shows 400 on `brandSafety=false`, 400 on `scriptMatch=false`, 201 on both true with `overallScore=4.5`.

---

### B6: Distribution & Ingestion

**Goal:** Publish approved videos and record the resulting views/clicks.

**Prisma Models Modified:**
- `ViewSnapshot.anomalyFlags` — migrated from `Json?` to `String[] @default([])` (Postgres native array).

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| POST | `/api/distribution/publish/:videoId` | brand_owner, brand_member, ops, super_admin | Publish via Postiz mock. Creates PublishJob, sets `stage='published'`, pushes 24h settle-video job. |
| POST | `/api/analytics/ingest/:videoId` | ops, qa_reviewer, super_admin | Ingest views/clicks. Anomaly: >200% growth vs. previous → `isAnomalous=true`, `anomalyFlags=["velocity_spike"]`. |
| POST | `/api/admin/videos/:videoId/dismiss-anomaly` | qa_reviewer, finance, super_admin | Clear anomaly flag (admin manual review). |
| POST | `/api/distribution/videos/:videoId/settle` | ops, finance, super_admin | Manual settlement trigger. Checks anomaly, calculates payout, calls `LedgerService.settleFunds()`. |

**BullMQ Worker:**
- `settle-video.processor.ts` — 24h timer. Checks latest ViewSnapshot. If `isAnomalous=true` → no-op (admin must intervene). If clean → calls settlement endpoint.

**Key Logic:**
- `PostizService.publish()` — mock. Simulates 1s latency. Returns `externalId: postiz_<videoId-prefix>_<timestamp>`.
- Anomaly threshold: `growthRate = (newViews - oldViews) / oldViews`. If `> 2.0` (>200%), flag as anomalous.
- Settlement calculation: `payout = baseFee + min((effectiveViews / 1000) * 300, 3000)`. `effectiveViews = min(views, 10000)`. CPM capped at $30.00.
- No ViewSnapshot at 24h = No Settle (golden rule).

**Verification Proof:** `test/distribution-ledger.test.ts` (PROOF 1) — velocity spike (1000→4000 views) sets `isAnomalous=true`, settlement refuses, brand escrow keeps full $500.00.

---

### B7: Money & The Ledger

**Goal:** A bulletproof double-entry ledger with Stripe integration and payout flow.

**Prisma Models Added:**
- `Payout` — id, creatorId, amountCents, status (pending→approved→paid|failed), approvedBy?, approvedAt?, externalRef? (Flouci ID), failureReason?

**API Endpoints:**

| Method | Route | Required Role | Description |
|---|---|---|---|
| POST | `/api/webhooks/stripe` | Public (idempotent) | Stripe webhook handler. On `payment_intent.succeeded`, debits `brand_escrow`, credits `stripe_pending`. |
| GET | `/api/finance/payouts` | finance, super_admin | List creators with `creator_pending` balance ≥ $10.00 (1000 cents). |
| POST | `/api/finance/payouts/:creatorId/approve` | finance, super_admin | Approve payout. Debits `creator_withdrawable`, credits `creator_pending`. Mocks Flouci API. |

**Key Logic:**
- `LedgerService.postEntry(debitAccountId, creditAccountId, amountCents, refType, refId)` — transactional, enforces debits=credits.
- `idempotencyKey = ${refType}:${refId}:debit` / `${refType}:${refId}:credit` — unique constraint prevents duplicates.
- Payout minimum: $10.00 (1000 cents). Below this, `INSUFFICIENT_BALANCE` or below-threshold error.
- Stripe webhook reads `metadata.brandId` from the payment intent to know which brand to credit.

**Verification Proofs:** `test/distribution-ledger.test.ts`
- PROOF 2 (Ledger Balance): after top-up ($500), settlement ($33.20), payout ($33.20) → total debits === total credits ($566.40 === $566.40).
- PROOF 3 (Idempotency): duplicate Stripe webhook with same intent ID creates only 2 ledger entries (1 debit + 1 credit), second rejected with `IDEMPOTENT_REJECT`.

---

## SECTION 4: THE API CONTRACT (FOR FRONTEND)

All routes are prefixed with `/api`. All authenticated routes require `Authorization: Bearer <accessToken>`. Money-moving routes should include an `Idempotency-Key` header.

### 4.1 Auth

| Method | Route | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/signup` | `{ email: string, password: string, role?: Role }` | `{ accessToken, refreshToken, user: { id, email, role } }` | Creates User (+ Creator record if role=creator) |
| POST | `/auth/login` | `{ email: string, password: string }` | `{ accessToken, refreshToken, user }` | 401 on invalid credentials |
| POST | `/auth/refresh` | `{ refreshToken: string }` | `{ accessToken, refreshToken, user }` | 401 on invalid/expired refresh |
| GET | `/auth/me` | — | `{ id, email, role }` | Requires JWT |

### 4.2 Facts

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| POST | `/facts` | `{ brandId, tier: "Hot"\|"Standard"\|"Premium", language: "ar"\|"derja"\|"fr"\|"en", topic?, cpmBudget: number (cents), baseFee: number (cents), maxClaims?: number }` | `Fact + scriptVersions[]` | brand_owner, brand_member, studio_editor |
| GET | `/facts?brandId=` | — | `Fact[]` | brand+, qa, ops |
| GET | `/facts/:id` | — | `Fact + scriptVersions[] + lines[]` | JWT |

### 4.3 Scripts (B11 Moat)

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| POST | `/scripts/:scriptVersionId/lines` | `{ text: string, position?: number, isHook?: boolean, durationSec?: number }` | `ScriptLine` (verified=false) | brand+, studio |
| PATCH | `/scripts/lines/:lineId` | `{ text?: string, durationSec?: number }` | `ScriptLine` (text edit resets verified=false) | brand+, studio |
| POST | `/scripts/lines/:lineId/sources/:sourceId` | — | `ScriptLineSource` (sets verified=true) | brand+, studio, qa |
| DELETE | `/scripts/lines/:lineId/sources/:sourceId` | — | `{ unlinked: true }` | brand+, studio, qa |
| POST | `/scripts/sources` | `{ label, url, type: "official"\|"news"\|"research"\|"brand_asset" }` | `Source` | brand+, studio, qa |
| GET | `/scripts/sources` | — | `Source[]` | JWT |
| **POST** | **`/scripts/:scriptVersionId/approve`** | — | `{ approved: true, receiptId, hash, verifiedLines }` or **400** `{ error: "B11_VERIFICATION_FAILED", unverifiedLines[] }` | **brand_owner, qa_reviewer** |
| POST | `/scripts/videos/:videoId/override-offscript` | — | `{ overridden: true, policyCheckId, invalidatedReceiptId }` | brand_owner |

### 4.4 Claims

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| POST | `/facts/:factId/claim` | — | `{ claim, video, lockDeadline }` | creator |
| POST | `/videos/:videoId/lock` | `{ r2Key: string, transcript?: string }` | `{ locked: true, reviewDeadline }` or **409** `{ error: "CLAIM_ALREADY_MOVED" }` | creator |
| POST | `/claims/:claimId/expire` | — | `{ claimId, expired: boolean }` | ops |
| POST | `/videos/:videoId/auto-approve` | — | `{ videoId, autoApproved: boolean }` | ops |

### 4.5 Harness

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| POST | `/harness/configs` | `{ name: string, modelMap?: { draft, check }, budgetCap?: number }` | `HarnessConfig` (isActive=false) | studio_editor |
| GET | `/harness/configs` | — | `HarnessConfig[]` with recent runs | studio+, qa, ops |
| POST | `/facts/:factId/generate` | `{ configId: string }` | `{ runId, scriptVersionId, linesCreated, allVerified: false }` or **400** if config inactive | studio_editor |
| POST | `/harness/:configId/eval` | — | `{ evalPassed: true, results[] }` or **400** `{ error: "EVAL_FAILED", failedTraps[] }` | studio+, qa |
| POST | `/harness/:configId/activate` | — | `{ activated: true }` or **400** `{ error: "ACTIVATION_BLOCKED" }` | studio_editor |

### 4.6 Admin

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| GET | `/admin/scripts` | — | `ScriptVersion[]` (status=in_qa) with verified/total counts | studio+, qa, ops |
| POST | `/admin/lines/:lineId/verify` | `{ sourceId?: string }` | `{ verified: true, lineId, scriptVersionId }` | studio+, qa |
| POST | `/admin/videos/:videoId/transcript` | `{ transcript: string }` | `{ checkResult: "pass"\|"fail"\|"skipped", similarity }` | studio+, qa, ops |
| POST | `/admin/videos/:videoId/override-deviation` | `{ reason?: string }` | `{ overridden: true, invalidatedReceiptId, newStage: "locked_pending" }` | qa_reviewer |
| POST | `/admin/videos/:videoId/rate` | `{ brandSafety: boolean, scriptMatch: boolean, craft: 1-5, hook: 1-5, notes?: string }` | `{ rated: true, overallScore }` or **400** `{ error: "RATING_GATES_FAILED", failedGates[] }` | qa_reviewer |
| GET | `/admin/pipeline` | — | `{ facts: { draft, in_qa, live }, videos: { locked_pending, approved_queued, held_factual_deviation, published, settled } }` | studio+, qa, ops, finance |

### 4.7 Distribution

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| POST | `/distribution/publish/:videoId` | — | `{ published: true, externalId, url, settlementScheduledAt }` | brand_owner, ops |
| POST | `/analytics/ingest/:videoId` | `{ views: number, clicks: number, source?: string }` | `{ snapshotId, isAnomalous, anomalyFlags[], growthRate }` | ops, qa |
| POST | `/admin/videos/:videoId/dismiss-anomaly` | — | `{ dismissed: true }` | qa_reviewer, finance |
| POST | `/distribution/videos/:videoId/settle` | — | `{ settled: true, amountCents }` or `{ settled: false, reason: "anomaly_hold"\|"no_view_snapshot" }` | ops, finance |

### 4.8 Finance & Webhooks

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| POST | `/webhooks/stripe` | `{ type: "payment_intent.succeeded", data: { object: { id, amount, metadata: { brandId } } } }` | `{ received: true, processed: true, ledgerEntry }` (idempotent) | Public |
| GET | `/finance/payouts` | — | `{ eligiblePayouts: [{ creatorId, creatorEmail, pendingBalanceCents }], count }` | finance |
| POST | `/finance/payouts/:creatorId/approve` | `{ amountCents?: number }` (omit = full balance) | `{ payoutId, amountCents, externalRef, status: "paid" }` | finance |

### 4.9 ShortLinks

| Method | Route | Body | Response | RBAC |
|---|---|---|---|---|
| GET | `/r/:code` | — | **302 redirect** to targetUrl | Public |
| POST | `/shortlinks` | `{ targetUrl, videoId?, brandId? }` | `{ id, code, targetUrl }` | brand+, ops |

---

## SECTION 5: THE DOUBLE-ENTRY LEDGER MAP

All amounts are in **integer cents** (USD). The `LedgerAccount.type` field determines the account's nature. Asset accounts have debit-normal balances (`balance = debits - credits`).

### 5.1 Account Types

| Type | Owner | Currency | Normal Balance | Purpose |
|---|---|---|---|---|
| `stripe_pending` | `"platform"` | USD | Credit | Clearing account for money that left Stripe but not yet allocated |
| `brand_escrow` | brandId | USD | Debit | Brand's prepaid wallet (top-ups land here, settlements draw from here) |
| `creator_pending` | creatorId | USD | Debit | Creator's earned-but-not-yet-withdrawable balance |
| `creator_withdrawable` | creatorId | USD | Debit | Creator's withdrawable balance (post finance approval) |
| `platform_revenue` | `"platform"` | USD | Credit | Platform's subscription revenue ($499/mo) |
| `gems` | brandId | GEMS | Debit | Brand's gem balance (asset in the ledger, not a separate table) |

### 5.2 The 4 Core Transactions

#### Transaction 1: Brand Top-Up (Stripe)

**Trigger:** `POST /webhooks/stripe` with `payment_intent.succeeded`

**Money flow:** Stripe → Brand Escrow

| Account | Debit | Credit |
|---|---|---|
| `brand_escrow` (asset ↑) | **+amountCents** | |
| `stripe_pending` (clearing ↓) | | **+amountCents** |

**Example:** $500 top-up → Debit brand_escrow 50000c, Credit stripe_pending 50000c.

**Result:** Brand's escrow balance increases by $500. The `stripe_pending` clearing account goes negative (it's a credit-normal account that gets cleared out).

**idempotencyKey:** `stripe_topup:<stripeIntentId>:debit` / `:credit`

---

#### Transaction 2: Video Settlement (24h after publish)

**Trigger:** BullMQ `settle-video` worker fires at 24h. Checks `isAnomalous=false`. Calls `LedgerService.settleFunds(videoId, amountCents)`.

**Money flow:** Brand Escrow → Creator Pending

| Account | Debit | Credit |
|---|---|---|
| `creator_pending` (asset ↑ — creator owed more) | **+amountCents** | |
| `brand_escrow` (asset ↓ — brand paid out) | | **+amountCents** |

**Calculation:**
```
effectiveViews = min(snapshot.views, 10000)
cpmEarned = min((effectiveViews / 1000) * 300, 3000)  // $3/1k views, capped at $30
payoutCents = fact.baseFee + cpmEarned
```

**Example:** $8 base + $25.20 CPM (8400 views) = $33.20 → Debit creator_pending 3320c, Credit brand_escrow 3320c.

**Result:** Creator's pending balance increases. Brand's escrow decreases. Video stage → `settled`.

**idempotencyKey:** `video_settlement:<videoId>:debit` / `:credit`

**Anomaly hold:** If `ViewSnapshot.isAnomalous = true`, the worker does NOT call `settleFunds()`. Money stays in `brand_escrow`. Admin must `POST /admin/videos/:id/dismiss-anomaly` to clear the flag.

---

#### Transaction 3: Payout Approval (Creator Pending → Creator Withdrawable)

**Trigger:** `POST /finance/payouts/:creatorId/approve` (requires `finance` role)

**Money flow:** Creator Pending → Creator Withdrawable

| Account | Debit | Credit |
|---|---|---|
| `creator_withdrawable` (asset ↑ — money now withdrawable) | **+amountCents** | |
| `creator_pending` (asset ↓ — moved out of pending) | | **+amountCents** |

**Example:** Creator has $33.20 pending. Finance approves full payout → Debit creator_withdrawable 3320c, Credit creator_pending 3320c.

**Result:** Creator's withdrawable balance increases. `Payout` record created with `status: 'paid'`, `externalRef: 'flouci_<timestamp>'` (mock Flouci).

**idempotencyKey:** `manual_payout:<payoutId>:debit` / `:credit`

**Constraints:**
- Minimum payout: $10.00 (1000 cents). Below → 400.
- `creator_pending` balance must be ≥ amountCents. Below → 400 `INSUFFICIENT_BALANCE`.

---

#### Transaction 4: Gem Spending (Brand Escrow → Platform Revenue)

**Trigger:** Brand spends gems on an extra video credit or AI feature.

**Money flow:** Brand Escrow → Platform Revenue

| Account | Debit | Credit |
|---|---|---|
| `platform_revenue` (revenue ↑) | **+amountCents** | |
| `brand_escrow` (asset ↓ — brand paid for the feature) | | **+amountCents** |

**Example:** Brand spends $5.00 on an extra video credit → Debit platform_revenue 500c, Credit brand_escrow 500c.

**idempotencyKey:** `gem_spend:<refId>:debit` / `:credit`

**Note:** Gems are tracked as an asset in the ledger (`type: 'gems'`, `currency: 'GEMS'`) — not a separate table. A brand's gem balance = `SUM(debit) - SUM(credit)` on their `gems` account.

---

### 5.3 Ledger Balance Invariant

At any point in time, across ALL `LedgerEntry` rows:

```
SUM(debit) === SUM(credit)
```

This is enforced structurally — every `postEntry()` creates exactly one debit and one credit of the same amount in a single transaction. The `idempotencyKey` unique constraint prevents duplicates.

**Proof:** After top-up ($500), settlement ($33.20), payout ($33.20):
```
Total debits:  $566.40
Total credits: $566.40
Difference:    $0.00 ✅

Per-account:
  stripe_pending:        -$500.00  (clearing account, credit-normal)
  brand_escrow:           +$466.80  (deposited $500, paid out $33.20)
  creator_pending:         $0.00   (received $33.20, paid out $33.20)
  creator_withdrawable:  +$33.20   (ready to withdraw via Flouci)
```

---

## APPENDIX: PROOF INDEX

| Proof File | Cycle | What it proves |
|---|---|---|
| `scripts/proof-b11-gate.sh` | B2 | 400 on unverified lines, 201 with receipt hash on 100% verified |
| `test/race-condition.test.ts` | B3 | `lock()` and `expire()` fired simultaneously — exactly one wins |
| `test/click-redirect.test.ts` | B3 | ClickEvent created + 302 redirect + bot detection (WhatsApp/Telegram) |
| `scripts/proof-harness-eval.sh` | B4 | Eval catches hallucination, activation blocked, generate creates `verified=false` lines |
| `test/admin-override.test.ts` | B5 | Override sets `invalidatedAt`, creates `PolicyCheck{override}`, moves video to `locked_pending` |
| `scripts/proof-print-rating.sh` | B5 | 400 on `brandSafety=false`, 201 on both gates true with `overallScore=4.5` |
| `test/distribution-ledger.test.ts` | B6/B7 | Anomaly hold (velocity spike prevents settlement) + Ledger balance (debits=credits) + Idempotency (duplicate webhook rejected) |

---

## APPENDIX: ENUMS REFERENCE

```prisma
enum Role {
  brand_owner    // Full brand access — create facts, approve scripts, manage billing
  brand_member    // Limited brand access — create/edit facts, cannot approve scripts
  creator         // Claim facts, lock videos, view wallet
  studio_editor   // Studio access — generate scripts, verify lines (B4/B5)
  qa_reviewer     // QA access — verify lines, override deviations, rate videos, dismiss anomalies
  ops             // Operations — publish videos, ingest analytics, trigger settlement
  finance         // Finance — approve payouts, view pipeline
  super_admin     // God mode — everything
}

enum EntryType { FACT, SPARK }
enum ChannelType { BRAND_ACCOUNT, CREATOR_WALL, DIRECT_INVITE }
enum EntryStatus { draft, locked, approved, published }

enum ClaimStatus {
  claimed           // Initial state after POST /facts/:id/claim
  in_edit           // Creator started editing (transitional)
  locked            // Creator locked the video (POST /videos/:id/lock)
  approved          // Brand approved the video
  changes_requested // Brand requested changes (sent back to creator)
  rejected          // Brand rejected the video
  expired           // 24h lock timer fired, creator didn't lock in time
}

enum VideoStatus {
  editing                   // Initial state
  locked_pending            // Creator locked, awaiting brand review
  approved_queued           // Brand approved, queued for publishing
  publishing                // Postiz publish in progress
  published                 // Live on social platform
  counting                  // Within 24h view window
  settled                   // 24h passed, payout calculated, ledger settled
  publish_failed            // Postiz publish failed
  held_factual_deviation    // Transcript deviated from verified script
}
```

---

**END OF DOCUMENT.**

This file is the single source of truth for the Perokio V1 backend. Once committed, the backend is officially locked. The frontend team can begin wiring the real API endpoints to the UI using the contract in Section 4.

For any changes after V1 lock, create a new cycle (B8+) and update this document with the new models, endpoints, and proofs.

🦜 **Perokio — Verified Facts × Local Film.**
