/**
 * §5 — RACE CONDITION PROOF
 *
 * Demonstrates that lock() and expire() fired simultaneously cannot both
 * succeed. The conditional SQL UPDATE WHERE status='claimed' ensures
 * exactly one wins.
 *
 * Run: npx ts-node test/race-condition.test.ts
 */
import { prisma } from '../packages/db/src';
import { ClaimsService } from '../apps/api/src/claims/claims.service';
import { QueueService } from '../apps/api/src/claims/queue.service';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  §5 — RACE CONDITION PROOF (lock vs expire)                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── Setup: create a brand, fact, creator, and a claim ───
  const owner = await prisma.user.create({
    data: { email: `race-${Date.now()}@test.dev`, passwordHash: 'x', role: 'brand_owner' },
  });
  const brand = await prisma.brand.create({ data: { name: 'Race Brand', ownerId: owner.id } });
  const fact = await prisma.fact.create({
    data: { brandId: brand.id, tier: 'Hot', language: 'en', status: 'live', cpmBudget: 300, baseFee: 800 },
  });
  const sv = await prisma.scriptVersion.create({ data: { factId: fact.id, version: 1, status: 'draft' } });
  const creatorUser = await prisma.user.create({
    data: { email: `creator-${Date.now()}@test.dev`, passwordHash: 'x', role: 'creator' },
  });
  const creator = await prisma.creator.create({ data: { userId: creatorUser.id } });
  const claim = await prisma.claim.create({
    data: { factId: fact.id, creatorId: creator.id, status: 'claimed', lockDeadline: new Date(Date.now() + 86400000) },
  });
  const video = await prisma.video.create({
    data: { claimId: claim.id, stage: 'editing' },
  });

  console.log(`  Claim: ${claim.id} (status: claimed)`);
  console.log(`  Video: ${video.id}`);
  console.log('');

  // ─── Create the services ───
  const queue = new QueueService();
  await queue.onModuleInit();
  const claims = new ClaimsService(queue);

  // ─── THE RACE: fire lock() and expire() simultaneously ───
  console.log('▶ Firing lock() and expire() simultaneously via Promise.all...\n');

  const results = await Promise.allSettled([
    // lock() — tries to move claim → 'locked'
    claims.lockVideo(video.id, creator.id, 'r2://test-video.mp4', 'transcript ok'),
    // expire() — tries to move claim → 'expired' (simulating the BullMQ timer)
    claims.expireClaim(claim.id),
  ]);

  const lockResult = results[0];
  const expireResult = results[1];

  console.log('  lock()   →', lockResult.status, lockResult.status === 'fulfilled' ? JSON.stringify(lockResult.value) : lockResult.reason.message);
  console.log('  expire() →', expireResult.status, expireResult.status === 'fulfilled' ? JSON.stringify(expireResult.value) : expireResult.reason.message);
  console.log('');

  // ─── Verify: exactly one won ───
  const finalClaim = await prisma.claim.findUnique({ where: { id: claim.id } });
  console.log(`  Final claim status: ${finalClaim.status}`);
  console.log('');

  let pass = false;
  if (finalClaim.status === 'locked' && expireResult.status === 'fulfilled' && expireResult.value === false) {
    console.log('  ✅ PASS: lock() won, expire() was a no-op (returned false)');
    pass = true;
  } else if (finalClaim.status === 'expired' && lockResult.status === 'rejected') {
    console.log('  ✅ PASS: expire() won, lock() was rejected (ConflictException)');
    pass = true;
  } else {
    console.log('  ❌ FAIL: unexpected state — both or neither won');
  }

  // ─── Cleanup (delete in FK-safe order) ───
  await prisma.video.deleteMany({ where: { claimId: claim.id } });
  await prisma.claim.delete({ where: { id: claim.id } });
  await prisma.scriptVersion.deleteMany({ where: { factId: fact.id } });
  await prisma.fact.delete({ where: { id: fact.id } });
  await prisma.brand.delete({ where: { id: brand.id } });
  await prisma.creator.delete({ where: { id: creator.id } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, creatorUser.id] } } });

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  RACE CONDITION PROOF: ${pass ? 'PASS ✅' : 'FAIL ❌'}                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await prisma.$disconnect();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
