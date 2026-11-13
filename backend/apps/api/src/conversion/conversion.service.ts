import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { prisma } from '@perokio/db';
import * as crypto from 'crypto';

// ============================================================================
// ConversionService — tracks CTA clicks + TastyIgniter orders
// ============================================================================
// Phase 3: The Conversion Loop
//   - POST /webhooks/tastyigniter/cta → records a CtaClickEvent
//   - POST /webhooks/tastyigniter/order → records a TastyIgniterOrder
//   - GET /conversion/stats/:brandId → returns clicks, orders, revenue, CVR
// ============================================================================

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  /** Record a CTA click from a Perokio video */
  async recordCtaClick(data: {
    videoId?: string
    shortLinkId?: string
    brandId?: string
    creatorId?: string
    ip: string
    userAgent?: string
    ctaType?: string
  }) {
    const ipHash = crypto
      .createHash('sha256')
      .update(data.ip + (process.env.JWT_SECRET || 'salt'))
      .digest('hex');

    const click = await prisma.ctaClickEvent.create({
      data: {
        videoId: data.videoId || null,
        shortLinkId: data.shortLinkId || null,
        brandId: data.brandId || null,
        creatorId: data.creatorId || null,
        ipHash,
        userAgent: data.userAgent || null,
        ctaType: data.ctaType || 'order_now',
      },
    });

    this.logger.log(`👆 CTA click recorded: brand=${data.brandId}, video=${data.videoId}, type=${data.ctaType}`);
    return click;
  }

  /** Record a TastyIgniter order (from webhook) */
  async recordOrder(data: {
    orderId: string
    videoId?: string
    brandId?: string
    shortLinkId?: string
    amountCents: number
    currency?: string
    status?: string
    customerEmail?: string
    customerPhone?: string
    items?: any[]
  }) {
    // Idempotency: check if order already exists
    const existing = await prisma.tastyIgniterOrder.findUnique({
      where: { orderId: data.orderId },
    });
    if (existing) {
      this.logger.log(`Order ${data.orderId} already recorded — ignoring (idempotent)`);
      return existing;
    }

    const order = await prisma.tastyIgniterOrder.create({
      data: {
        orderId: data.orderId,
        videoId: data.videoId || null,
        brandId: data.brandId || null,
        shortLinkId: data.shortLinkId || null,
        amountCents: data.amountCents,
        currency: data.currency || 'USD',
        status: data.status || 'completed',
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone || null,
        items: data.items || null,
      },
    });

    this.logger.log(`🛒 Order recorded: ${data.orderId} — $${(data.amountCents / 100).toFixed(2)} (brand=${data.brandId})`);
    return order;
  }

  /** Get conversion stats for a brand */
  async getStats(brandId: string) {
    const [clicks, orders] = await Promise.all([
      prisma.ctaClickEvent.count({ where: { brandId } }),
      prisma.tastyIgniterOrder.findMany({
        where: { brandId, status: 'completed' },
        select: { amountCents: true, orderedAt: true },
      }),
    ]);

    const totalOrders = orders.length;
    const totalRevenueCents = orders.reduce((sum, o) => sum + o.amountCents, 0);
    const conversionRate = clicks > 0 ? (totalOrders / clicks) * 100 : 0;

    return {
      brandId,
      totalClicks: clicks,
      totalOrders,
      conversionRate: Number(conversionRate.toFixed(2)),
      attributedRevenueCents: totalRevenueCents,
      attributedRevenueUsd: Number((totalRevenueCents / 100).toFixed(2)),
    };
  }

  /** Get stats for all brands (for the admin Lead Magnet dashboard) */
  async getAllStats() {
    const [allClicks, allOrders] = await Promise.all([
      prisma.ctaClickEvent.count(),
      prisma.tastyIgniterOrder.findMany({
        where: { status: 'completed' },
        select: { amountCents: true, brandId: true, orderedAt: true },
      }),
    ]);

    const totalRevenueCents = allOrders.reduce((sum, o) => sum + o.amountCents, 0);
    const conversionRate = allClicks > 0 ? (allOrders.length / allClicks) * 100 : 0;

    // Per-brand breakdown
    const brandMap = new Map<string, { clicks: number; orders: number; revenueCents: number }>();
    // We need to count clicks per brand too
    const clicksPerBrand = await prisma.ctaClickEvent.groupBy({
      by: ['brandId'],
      _count: true,
    });
    clicksPerBrand.forEach((c) => {
      const brandId = c.brandId || 'unknown';
      brandMap.set(brandId, { clicks: c._count, orders: 0, revenueCents: 0 });
    });

    allOrders.forEach((o) => {
      const brandId = o.brandId || 'unknown';
      const existing = brandMap.get(brandId) || { clicks: 0, orders: 0, revenueCents: 0 };
      existing.orders += 1;
      existing.revenueCents += o.amountCents;
      brandMap.set(brandId, existing);
    });

    const perBrand = Array.from(brandMap.entries()).map(([brandId, stats]) => ({
      brandId,
      ...stats,
      conversionRate: stats.clicks > 0 ? Number(((stats.orders / stats.clicks) * 100).toFixed(2)) : 0,
      revenueUsd: Number((stats.revenueCents / 100).toFixed(2)),
    }));

    return {
      totalClicks: allClicks,
      totalOrders: allOrders.length,
      conversionRate: Number(conversionRate.toFixed(2)),
      attributedRevenueCents: totalRevenueCents,
      attributedRevenueUsd: Number((totalRevenueCents / 100).toFixed(2)),
      perBrand,
    };
  }
}
