/**
 * §4 — ADMIN OVERRIDE PROOF
 *
 * Demonstrates: POST /admin/videos/:id/override-deviation successfully
 *   1. Creates a PolicyCheck { result: 'override' }
 *   2. Sets VerificationReceipt.invalidatedAt = now()
 *   3. Moves Video.stage from 'held_factual_deviation' → 'locked_pending'
 *
 * Run: npx ts-node test/admin-override.test.ts
 */
import { prisma } from '../packages/db/src';
import { AdminService } from '../apps/api/src/admin/admin.service';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  §4 — ADMIN OVERRIDE PROOF                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ─── Setup: create brand, fact, script (approved), claim, video ───
  console.log('▶ Setup: create brand + approved script + claim + video');
  const admin = await prisma.user.create({
    data: { email: `admin-${Date.now()}@test.dev`, passwordHash: 'x', role: 'qa_reviewer' },
  });
  const owner = await prisma.user.create({
    data: { email: `owner-${Date.now()}@test.dev`, passwordHash: 'x', role: 'brand_owner' },
  });
  const brand = await prisma.brand.create({ data: { name: 'Override Test Brand', ownerId: owner.id } });
  const fact = await prisma.fact.create({
    data: { brandId: brand.id, tier: 'Hot', language: 'en', status: 'approved', cpmBudget: 300, baseFee: 800 },
  });

  // Create an APPROVED script version with a verification receipt
  const sv = await prisma.scriptVersion.create({ data: { factId: fact.id, version: 1, status: 'approved' } });
  const line = await prisma.scriptLine.create({
    data: { scriptVersionId: sv.id, position: 0, text: 'Dar Zaitouna beans come from Cap Bon', verified: true, isHook: true, durationSec: 5 },
  });
  const source = await prisma.source.create({
    data: { label: 'Cap Bon Report', url: 'https://capbon.tn/report.pdf', type: 'official', verifiedBy: admin.id },
  });
  await prisma.scriptLineSource.create({ data: { scriptLineId: line.id, sourceId: source.id } });

  // Create the verification receipt (B11 moat)
  const receipt = await prisma.verificationReceipt.create({
    data: { scriptVersionId: sv.id, hash: 'abc123def456', reviewerId: admin.id },
  });

  // Create a creator + claim + video (held_factual_deviation)
  const creatorUser = await prisma.user.create({
    data: { email: `creator-${Date.now()}@test.dev`, passwordHash: 'x', role: 'creator' },
  });
  const creator = await prisma.creator.create({ data: { userId: creatorUser.id } });
  const claim = await prisma.claim.create({
    data: { factId: fact.id, creatorId: creator.id, status: 'locked', lockDeadline: new Date(Date.now() + 86400000) },
  });
  const video = await prisma.video.create({
    data: { claimId: claim.id, stage: 'held_factual_deviation' },
  });

  // Pre-override: insert a PolicyCheck fail (simulating the transcript deviation)
  await prisma.policyCheck.create({
    data: { videoId: video.id, checkType: 'script_match', result: 'fail', details: 'Transcript deviated' },
  });

  console.log(`  Video: ${video.id} (stage: held_factual_deviation)`);
  console.log(`  Receipt: ${receipt.id} (invalidatedAt: ${receipt.invalidatedAt || 'null'})`);
  console.log('');

  // ─── Pre-condition checks ───
  console.log('▶ Pre-condition checks');
  const beforeVideo = await prisma.video.findUnique({ where: { id: video.id } });
  const beforeReceipt = await prisma.verificationReceipt.findUnique({ where: { id: receipt.id } });
  const beforeChecks = await prisma.policyCheck.count({ where: { videoId: video.id } });
  console.log(`  Video stage: ${beforeVideo.stage} (expected: held_factual_deviation)`);
  console.log(`  Receipt invalidatedAt: ${beforeReceipt.invalidatedAt || 'null'} (expected: null)`);
  console.log(`  PolicyChecks count: ${beforeChecks} (expected: 1)`);
  console.log('');

  // ─── THE OVERRIDE ───
  console.log('▶ Call overrideDeviation()');
  const service = new AdminService();
  const result = await service.overrideDeviation(video.id, admin.id, 'Brand accepts the off-script risk');
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log('');

  // ─── Post-condition checks ───
  console.log('▶ Post-condition checks');
  const afterVideo = await prisma.video.findUnique({ where: { id: video.id } });
  const afterReceipt = await prisma.verificationReceipt.findUnique({ where: { id: receipt.id } });
  const afterChecks = await prisma.policyCheck.findMany({
    where: { videoId: video.id },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`  Video stage: ${afterVideo.stage} (expected: locked_pending)`);
  console.log(`  Receipt invalidatedAt: ${afterReceipt.invalidatedAt || 'null'} (expected: NOT null)`);
  console.log(`  Receipt invalidatedBy: ${afterReceipt.invalidatedBy || 'null'} (expected: ${admin.id})`);
  console.log(`  Receipt invalidatedReason: ${afterReceipt.invalidatedReason || 'null'}`);
  console.log(`  PolicyChecks count: ${afterChecks.length} (expected: 2 — fail + override)`);
  console.log(`  Latest PolicyCheck result: ${afterChecks[0]?.result} (expected: override)`);
  console.log(`  Latest PolicyCheck checkType: ${afterChecks[0]?.checkType} (expected: off_script_override)`);
  console.log('');

  // ─── Pass/Fail ───
  const pass =
    afterVideo.stage === 'locked_pending' &&
    afterReceipt.invalidatedAt !== null &&
    afterReceipt.invalidatedBy === admin.id &&
    afterChecks.length === 2 &&
    afterChecks[0]?.result === 'override' &&
    afterChecks[0]?.checkType === 'off_script_override';

  console.log(`  Video moved to locked_pending: ${afterVideo.stage === 'locked_pending' ? '✅' : '❌'}`);
  console.log(`  Receipt invalidatedAt set: ${afterReceipt.invalidatedAt !== null ? '✅' : '❌'}`);
  console.log(`  Receipt invalidatedBy = admin: ${afterReceipt.invalidatedBy === admin.id ? '✅' : '❌'}`);
  console.log(`  Override PolicyCheck created: ${afterChecks[0]?.result === 'override' ? '✅' : '❌'}`);
  console.log('');

  // ─── Cleanup ───
  await prisma.policyCheck.deleteMany({ where: { videoId: video.id } });
  await prisma.video.delete({ where: { id: video.id } });
  await prisma.claim.delete({ where: { id: claim.id } });
  await prisma.scriptLineSource.deleteMany({ where: { scriptLineId: line.id } });
  await prisma.scriptLine.deleteMany({ where: { scriptVersionId: sv.id } });
  await prisma.verificationReceipt.deleteMany({ where: { scriptVersionId: sv.id } });
  await prisma.scriptVersion.deleteMany({ where: { factId: fact.id } });
  await prisma.source.delete({ where: { id: source.id } });
  await prisma.fact.delete({ where: { id: fact.id } });
  await prisma.brand.delete({ where: { id: brand.id } });
  await prisma.creator.delete({ where: { id: creator.id } });
  await prisma.user.deleteMany({ where: { id: { in: [admin.id, owner.id, creatorUser.id] } } });

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  ADMIN OVERRIDE PROOF: ${pass ? 'PASS ✅' : 'FAIL ❌'}                                    ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await prisma.$disconnect();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
