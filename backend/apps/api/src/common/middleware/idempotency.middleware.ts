import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
    });
  }
  return redisClient;
}

/**
 * IdempotencyMiddleware — checks the Idempotency-Key header on money endpoints.
 * If the key was seen before, returns the cached response.
 * If not, processes the request and caches the response.
 *
 * Usage: apply to routes that move money (top-up, claim, lock, withdraw).
 * Client must send `Idempotency-Key: <uuid>` header.
 */
@Injectable()
export class IdempotencyMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const key = req.headers['idempotency-key'] as string;
    if (!key) {
      // No key = not idempotent-protected, just proceed
      return next();
    }

    const redisKey = `idem:${key}`;
    const redis = getRedis();

    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        res.status(parsed.statusCode).json(parsed.body);
        return;
      }
    } catch {
      // Redis down — fail open (don't block the request), but log
      console.error('[Idempotency] Redis unavailable, proceeding without cache');
      return next();
    }

    // Intercept the response to cache it
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      const statusCode = res.statusCode;
      // Only cache successful responses (2xx)
      if (statusCode >= 200 && statusCode < 300) {
        getRedis()
          .set(redisKey, JSON.stringify({ statusCode, body }), 'EX', 86400)
          .catch(() => {}); // 24h TTL
      }
      return originalJson(body);
    };

    next();
  }
}
