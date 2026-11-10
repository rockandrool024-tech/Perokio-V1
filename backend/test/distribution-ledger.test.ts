/**
 * §4 — ANOMALY HOLD PROOF + LEDGER BALANCE PROOF + IDEMPOTENCY PROOF
 *
 * This single comprehensive test demonstrates all three core guarantees:
 *
 *   1. ANOMALY HOLD: A velocity spike (>200% growth) sets isAnomalous = true,
 *      and the settlement worker refuses to move funds. Balance stays in
 *      brand_escrow.
 *
 *   2. LEDGER BALANCE: After a top-up ($500), settlement ($33), and payout
 *      ($33), sum(debits) === sum(credits) across ALL ledger entries.
 *
 *   3. IDEMPOTENCY: Hitting the Stripe webhook twice with the same intent ID
 *      creates only ONE ledger entry (the second is rejected by the
 *      idempotencyKey unique constraint).
 *
 * Run: npx ts-node test/distribution-ledger.test.ts
 */
import { prisma } from '../packages/db/src';
import { DistributionService } from '../apps/api/src/distribution/distribution.service';
import { PostizService } from '../apps/api/src/distribution/postiz.service';
import { QueueService } from '../apps/api/src/distribution/queue.service';
import { LedgerService } from '../apps/api/src/ledger/ledger.service';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  §4 — ANOMALY HOLD + LEDGER BALANCE + IDEMPOTENCY PROOF      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── Setup ───
  console.log('▶ Setup: create brand, creator, fact, approved script, claim, video');
  const admin = await prisma.user.create({ data: { email: `b67-${Date.now()}@test.dev`, passwordHash: 'x', role: 'super_admin' } });
  const owner = await prisma.user.create({ data: { email: `b67-owner-${Date.now()}@test.dev`, passwordHash: 'x', role: 'brand_owner' } });
  const brand = await prisma.brand.create({ data: { name: 'B67 Brand', ownerId: owner.id } });
  const fact = await prisma.fact.create({
    data: { brandId: brand.id, tier: 'Hot', language: 'en', status: 'live', cpmBudget: 300, baseFee: 800, maxClaims: 10 },
  });
  const creatorUser = await prisma.user.create({ data: { email: `b67-creator-${Date.now()}@test.dev`, passwordHash: 'x', role: 'creator' } });
  const creator = await prisma.creator.create({ data: { userId: creatorUser.id } });
  const claim = await prisma.claim.create({
    data: { factId: fact.id, creatorId: creator.id, status: 'locked', lockDeadline: new Date(Date.now() + 86400000) },
  });
  const video = await prisma.video.create({ data: { claimId: claim.id, stage: 'approved_queued' } });

  // Initialize services
  const postiz = new PostizService();
  const queue = new QueueService();
  await queue.onModuleInit();
  const distribution = new DistributionService(postiz, queue);
  const ledger = new LedgerService();

  console.log(`  Brand: ${brand.id}`);
  console.log(`  Creator: ${creator.id}`);
  console.log(`  Video: ${video.id} (stage: approved_queued)\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // PROOF 3: IDEMPOTENCY — duplicate Stripe webhook creates only ONE entry
  // ═══════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ PROOF 3: IDEMPOTENCY — duplicate Stripe webhook');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const stripeIntentId = `pi_test_${Date.now()}`;
  const topupAmount = 50000; // $500.00 in cents

  // First webhook call
  console.log(`  First webhook: intent=${stripeIntentId}, amount=${topupAmount}c ($500.00)`);
  const entry1 = await ledger.stripeTopUp(brand.id, topupAmount, stripeIntentId);
  console.log(`  → Entry created: ${entry1.debitEntryId}\n`);

  // Second webhook call (duplicate)
  console.log(`  Second webhook (DUPLICATE): intent=${stripeIntentId}`);
  let duplicateRejected = false;
  try {
    await ledger.stripeTopUp(brand.id, topupAmount, stripeIntentId);
    console.log('  ❌ FAIL: duplicate was NOT rejected');
  } catch (e: any) {
    duplicateRejected = e.response?.error === 'IDEMPOTENT_REJECT' || e.message?.includes('IDEMPOTENT_REJECT');
    console.log(`  → Rejected: ${duplicateRejected ? '✅ YES' : '❌ NO'} (${e.response?.error || e.message?.substring(0, 50)})\n`);
  }

  // Count ledger entries for this refId
  const entriesForIntent = await prisma.ledgerEntry.count({
    where: { refId: stripeIntentId },
  });
  console.log(`  Ledger entries for intent ${stripeIntentId}: ${entriesForIntent} (expected: 2 — 1 debit + 1 credit)\n`);

  const idempotencyPass = duplicateRejected && entriesForIntent === 2;
  console.log(`  IDEMPOTENCY PROOF: ${idempotencyPass ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // PROOF 1: ANOMALY HOLD — velocity spike prevents settlement
  // ═══════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ PROOF 1: ANOMALY HOLD — velocity spike prevents settlement');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━══━━━━━━━━━━━━━━━━━\n');

  // First: publish the video
  console.log('  Publishing video via mock Postiz...');
  const pubResult = await distribution.publishVideo(video.id);
  console.log(`  → Published: externalId=${pubResult.externalId}\n`);

  // Ingest a normal first snapshot
  console.log('  Ingesting snapshot #1: 1000 views (normal)');
  const snap1 = await distribution.ingestAnalytics(video.id, 1000, 50, 'tiktok_api');
  console.log(`  → isAnomalous: ${snap1.isAnomalous}, growthRate: ${snap1.growthRate}\n`);

  // Ingest a SECOND snapshot with >200% growth (1000 → 4000 = 300% growth)
  console.log('  Ingesting snapshot #2: 4000 views (300% growth — ANOMALY)');
  const snap2 = await distribution.ingestAnalytics(video.id, 4000, 200, 'tiktok_api');
  console.log(`  → isAnomalous: ${snap2.isAnomalous} (expected: true)`);
  console.log(`  → anomalyFlags: [${snap2.anomalyFlags.join(', ')}] (expected: [velocity_spike])\n`);

  // Attempt settlement — should be BLOCKED by the anomaly
  console.log('  Attempting settlement (anomaly present)...');
  const settleResult = await distribution.settleVideo(video.id);
  console.log(`  → settled: ${settleResult.settled} (expected: false)`);
  console.log(`  → reason: ${settleResult.reason} (expected: anomaly_hold)\n`);

  // Verify the video is still in 'published' stage (not settled)
  const videoAfterAnomaly = await prisma.video.findUnique({ where: { id: video.id } });
  console.log(`  Video stage: ${videoAfterAnomaly.stage} (expected: published — NOT settled)\n`);

  // Check brand_escrow balance — should still have the full $500.00 (no money moved)
  const escrowAccount = await ledger.getOrCreateAccount(brand.id, 'brand_escrow', 'USD');
  const escrowBalanceAfterAnomaly = await ledger.getBalance(escrowAccount.id);
  console.log(`  Brand escrow balance: ${escrowBalanceAfterAnomaly}c ($${(escrowBalanceAfterAnomaly / 100).toFixed(2)}) (expected: 50000c = $500.00)\n`);

  const anomalyPass =
    snap2.isAnomalous === true &&
    snap2.anomalyFlags.includes('velocity_spike') &&
    settleResult.settled === false &&
    settleResult.reason === 'anomaly_hold' &&
    videoAfterAnomaly.stage === 'published' &&
    escrowBalanceAfterAnomaly === 50000;

  console.log(`  ANOMALY HOLD PROOF: ${anomalyPass ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // Now: dismiss the anomaly and settle normally for the ledger proof
  // ═══════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ Dismiss anomaly + settle (for LEDGER BALANCE proof)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━══━━━━━━━━━━━━━━━━━\n');

  // Admin dismisses the anomaly
  console.log('  Admin dismisses the anomaly...');
  await distribution.dismissAnomaly(video.id, admin.id);
  console.log('  → Anomaly cleared\n');

  // Ingest a final clean snapshot (capped views)
  console.log('  Ingesting snapshot #3: 8400 views (clean — no spike vs. snap2)');
  await distribution.ingestAnalytics(video.id, 8400, 600, 'tiktok_api');
  console.log('');

  // Settle
  console.log('  Settling video...');
  const settleResult2 = await distribution.settleVideo(video.id);
  console.log(`  → settled: ${settleResult2.settled} (expected: true)`);
  console.log(`  → amountCents: ${settleResult2.amountCents}c ($${(settleResult2.amountCents! / 100).toFixed(2)})`);
  console.log(`     (baseFee 800c + min(8400/1000 * 300, 3000) = 800 + 2520 = 3320c... `);
  console.log(`      but capped at 10000 views, so 8400 views × $3/1k = $25.20 + $8.00 base = $33.20)\n`);

  const videoAfterSettle = await prisma.video.findUnique({ where: { id: video.id } });
  console.log(`  Video stage: ${videoAfterSettle.stage} (expected: settled)\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // PROOF 2: LEDGER BALANCE — debits === credits across all entries
  // ═══════════════════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ PROOF 2: LEDGER BALANCE — debits === credits');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get all ledger entries
  const allEntries = await prisma.ledgerEntry.findMany();
  const totalDebits = allEntries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredits = allEntries.reduce((sum, e) => sum + (e.credit || 0), 0);

  console.log(`  Total ledger entries: ${allEntries.length}`);
  console.log(`  Total debits:  ${totalDebits}c ($${(totalDebits / 100).toFixed(2)})`);
  console.log(`  Total credits: ${totalCredits}c ($${(totalCredits / 100).toFixed(2)})`);
  console.log(`  Difference:    ${totalDebits - totalCredits}c (expected: 0)\n`);

  // Per-account breakdown
  const accounts = await prisma.ledgerAccount.findMany();
  console.log('  Per-account balances:');
  for (const acc of accounts) {
    const bal = await ledger.getBalance(acc.id);
    console.log(`    ${acc.ownerId.substring(0, 12)}... ${acc.type.padEnd(20)} ${acc.currency}: ${bal}c ($${(bal / 100).toFixed(2)})`);
  }
  console.log('');

  // Now approve a payout to the creator
  console.log('  Approving payout to creator...');
  const pendingAccount = await ledger.getOrCreateAccount(creator.id, 'creator_pending', 'USD');
  const pendingBalance = await ledger.getBalance(pendingAccount.id);
  console.log(`  Creator pending balance: ${pendingBalance}c ($${(pendingBalance / 100).toFixed(2)})\n`);

  if (pendingBalance >= 1000) {
    const payoutResult = await ledger.approvePayout(creator.id, pendingBalance, admin.id);
    console.log(`  → Payout approved: ${payoutResult.payoutId}`);
    console.log(`  → Amount: ${payoutResult.amountCents}c ($${(payoutResult.amountCents / 100).toFixed(2)})`);
    console.log(`  → External ref: ${payoutResult.externalRef}\n`);
  }

  // Re-check ledger balance after payout
  const allEntriesAfter = await prisma.ledgerEntry.findMany();
  const totalDebitsAfter = allEntriesAfter.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCreditsAfter = allEntriesAfter.reduce((sum, e) => sum + (e.credit || 0), 0);

  console.log('  After payout:');
  console.log(`  Total debits:  ${totalDebitsAfter}c ($${(totalDebitsAfter / 100).toFixed(2)})`);
  console.log(`  Total credits: ${totalCreditsAfter}c ($${(totalCreditsAfter / 100).toFixed(2)})`);
  console.log(`  Difference:    ${totalDebitsAfter - totalCreditsAfter}c (expected: 0)\n`);

  // Per-account after payout
  console.log('  Per-account balances after payout:');
  for (const acc of accounts) {
    const bal = await ledger.getBalance(acc.id);
    console.log(`    ${acc.ownerId.substring(0, 12)}... ${acc.type.padEnd(20)} ${acc.currency}: ${bal}c ($${(bal / 100).toFixed(2)})`);
  }
  console.log('');

  const ledgerPass = totalDebitsAfter === totalCreditsAfter && (totalDebitsAfter - totalCreditsAfter) === 0;
  console.log(`  LEDGER BALANCE PROOF: ${ledgerPass ? 'PASS ✅' : 'FAIL ❌'}\n`);

  // ═══════════════════════════════════════════════════════════════════════
  // Final summary
  // ═══════════════════════════════════════════════════════════════════════
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  ANOMALY HOLD:   ${anomalyPass ? 'PASS ✅' : 'FAIL ❌'}                                          ║`);
  console.log(`║  LEDGER BALANCE: ${ledgerPass ? 'PASS ✅' : 'FAIL ❌'}                                          ║`);
  console.log(`║  IDEMPOTENCY:    ${idempotencyPass ? 'PASS ✅' : 'FAIL ❌'}                                          ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  // Cleanup
  await prisma.payout.deleteMany({ where: { creatorId: creator.id } });
  await prisma.viewSnapshot.deleteMany({ where: { videoId: video.id } });
  await prisma.publishJob.deleteMany({ where: { videoId: video.id } });
  await prisma.ledgerEntry.deleteMany({});
  await prisma.ledgerAccount.deleteMany({});
  await prisma.video.delete({ where: { id: video.id } });
  await prisma.claim.delete({ where: { id: claim.id } });
  await prisma.fact.delete({ where: { id: fact.id } });
  await prisma.brand.delete({ where: { id: brand.id } });
  await prisma.creator.delete({ where: { id: creator.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin.id, owner.id, creatorUser.id] } } });

  await prisma.$disconnect();
  const allPass = anomalyPass && ledgerPass && idempotencyPass;
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
