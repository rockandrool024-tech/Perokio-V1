/**
 * §5 — CLICK REDIRECT PROOF
 *
 * Demonstrates: GET /r/:code creates a ClickEvent and returns a 302 redirect.
 * Also verifies bot detection (WhatsApp User-Agent → isBot=true).
 *
 * Run: npx ts-node test/click-redirect.test.ts
 */
import { prisma } from '../packages/db/src';
import { ShortLinksService } from '../apps/api/src/shortlinks/shortlinks.service';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  §5 — CLICK REDIRECT PROOF                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const service = new ShortLinksService();

  // ─── Setup: create a shortlink ───
  console.log('▶ Step 1: Create a shortlink');
  const link = await service.create({
    targetUrl: 'https://perokio.com/wall/fact-demo',
    brandId: undefined,
  });
  console.log(`  ShortLink code: ${link.code}`);
  console.log(`  Target URL: ${link.targetUrl}`);
  console.log('');

  // ─── Step 2: Normal browser click ───
  console.log('▶ Step 2: Normal browser click (Chrome UA)');
  const result1 = await service.resolveAndTrack(
    link.code,
    '203.0.113.42',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0',
  );
  console.log(`  Redirect to: ${result1.targetUrl}`);
  console.log(`  isBot: ${result1.isBot} (expected: false)`);
  console.log('');

  // ─── Step 3: Bot click (WhatsApp preview) ───
  console.log('▶ Step 3: Bot click (WhatsApp User-Agent)');
  const result2 = await service.resolveAndTrack(
    link.code,
    '203.0.113.99',
    'WhatsApp/2.24.20.76 A',
  );
  console.log(`  Redirect to: ${result2.targetUrl}`);
  console.log(`  isBot: ${result2.isBot} (expected: true — WhatsApp preview)`);
  console.log('');

  // ─── Step 4: Bot click (Telegram preview) ───
  console.log('▶ Step 4: Bot click (Telegram User-Agent)');
  const result3 = await service.resolveAndTrack(
    link.code,
    '203.0.113.100',
    'TelegramBot (like TwitterBot)',
  );
  console.log(`  isBot: ${result3.isBot} (expected: true — Telegram preview)`);
  console.log('');

  // ─── Step 5: Verify ClickEvents in DB ───
  console.log('▶ Step 5: Verify ClickEvents in database');
  const clicks = await prisma.clickEvent.findMany({
    where: { shortLinkId: link.id },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`  Total ClickEvents: ${clicks.length} (expected: 3)`);
  clicks.forEach((c, i) => {
    console.log(`    [${i + 1}] ipHash: ${c.ipHash.substring(0, 16)}... isBot: ${c.isBot} UA: ${c.userAgent?.substring(0, 40) || 'none'}`);
  });
  console.log('');

  const realClicks = clicks.filter((c) => !c.isBot).length;
  const botClicks = clicks.filter((c) => c.isBot).length;
  console.log(`  Real clicks: ${realClicks} (expected: 1)`);
  console.log(`  Bot clicks: ${botClicks} (expected: 2)`);
  console.log('');

  // ─── HTTP-level proof via the running API ───
  console.log('▶ Step 6: HTTP request to GET /r/:code (via running API)');
  const http = require('http');
  const httpResult: { status: number; location: string } = await new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:4000/api/r/' + link.code, {
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/131.0' },
      timeout: 5000,
    }, (res: any) => {
      resolve({ status: res.statusCode, location: res.headers.location || 'none' });
      res.resume();
    });
    req.on('error', (e: Error) => resolve({ status: 0, location: 'error: ' + e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, location: 'timeout' }); });
  });
  console.log(`  HTTP Status: ${httpResult.status} (expected: 302)`);
  console.log(`  Location: ${httpResult.location}`);
  console.log('');

  const pass =
    clicks.length === 3 &&
    realClicks === 1 &&
    botClicks === 2 &&
    httpResult.status === 302;

  // ─── Cleanup ───
  await prisma.clickEvent.deleteMany({ where: { shortLinkId: link.id } });
  await prisma.shortLink.delete({ where: { id: link.id } });

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log(`║  CLICK REDIRECT PROOF: ${pass ? 'PASS ✅' : 'FAIL ❌'}                                ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝');

  await prisma.$disconnect();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
