import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@perokio/db';
import * as crypto from 'crypto';
import { customAlphabet } from 'nanoid';

// 24-char unguessable code (base62)
const generateCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  24,
);

// Known bot user-agent substrings
const BOT_UA_PATTERNS = [
  'whatsapp',
  'telegram',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'googlebot',
  'bingbot',
  'slackbot',
  'discordbot',
  'preview',
  'crawler',
  'spider',
];

@Injectable()
export class ShortLinksService {
  /** Create a shortlink for a video or brand */
  async create(data: { targetUrl: string; videoId?: string; brandId?: string }) {
    const code = generateCode();
    return prisma.shortLink.create({
      data: {
        code,
        targetUrl: data.targetUrl,
        videoId: data.videoId || null,
        brandId: data.brandId || null,
      },
    });
  }

  /**
   * GET /r/:code — look up, record click, redirect.
   * §4: If User-Agent matches a known bot (WhatsApp/Telegram/social preview),
   * set isBot=true so the click doesn't count toward CTR.
   */
  async resolveAndTrack(code: string, ip: string, userAgent?: string) {
    const link = await prisma.shortLink.findUnique({ where: { code } });
    if (!link) {
      throw new NotFoundException(`Short link '${code}' not found`);
    }

    // Hash the IP for privacy (don't store raw IPs)
    const ipHash = crypto
      .createHash('sha256')
      .update(ip + (process.env.JWT_SECRET || 'salt'))
      .digest('hex');

    // Bot detection
    const isBot = userAgent
      ? BOT_UA_PATTERNS.some((p) => userAgent.toLowerCase().includes(p))
      : false;

    // Insert the ClickEvent
    await prisma.clickEvent.create({
      data: {
        shortLinkId: link.id,
        ipHash,
        userAgent: userAgent || null,
        isBot,
      },
    });

    return { targetUrl: link.targetUrl, isBot };
  }
}
