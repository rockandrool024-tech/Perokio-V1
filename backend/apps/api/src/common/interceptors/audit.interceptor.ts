import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { prisma } from '@perokio/db';

export const SKIP_AUDIT_KEY = 'skipAudit';

/**
 * AuditInterceptor — writes a DomainEvent for every POST/PATCH/DELETE.
 * Captures: eventType (method + route), actorId (from JWT), entityId (from response.id), payload (request body).
 * This is the LLM data moat — every state change is recorded.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return next.handle();

    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // Only audit mutations
    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const route = req.route?.path || req.url?.split('?')[0] || 'unknown';
    const actorId = req.user?.id || null;
    const payload = this.sanitizePayload(req.body);

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const entityId = response?.id || response?.claimId || response?.videoId || null;
          await prisma.domainEvent.create({
            data: {
              eventType: `${method} ${route}`,
              actorId,
              entityId,
              payload: {
                method,
                route,
                body: payload,
                statusCode: req.res?.statusCode || 200,
              },
            },
          });
        } catch (e) {
          // Audit failures should never break the request
          console.error('[AuditInterceptor] Failed to write DomainEvent:', e.message);
        }
      }),
    );
  }

  /** Strip sensitive fields before storing in the audit log */
  private sanitizePayload(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const clone = { ...body };
    delete clone.passwordHash;
    delete clone.password;
    delete clone.token;
    return clone;
  }
}
