import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export class SlidingWindowRateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private store: Map<string, RateLimitRecord>;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: { windowMs?: number; maxRequests?: number } = {}) {
    this.windowMs = options.windowMs || 60 * 1000; // 1 minute default
    this.maxRequests = options.maxRequests || 60; // 60 requests per minute default
    this.store = new Map();

    // Periodic cleanup of stale entries every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [ip, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);
      if (record.timestamps.length === 0) {
        this.store.delete(ip);
      }
    }
  }

  public check(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let record = this.store.get(ip);

    if (!record) {
      record = { timestamps: [] };
      this.store.set(ip, record);
    }

    // Filter out timestamps older than the sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const resetTime = Math.ceil((oldest + this.windowMs - now) / 1000);
      return { allowed: false, remaining: 0, resetTime: Math.max(1, resetTime) };
    }

    record.timestamps.push(now);
    const remaining = this.maxRequests - record.timestamps.length;
    return { allowed: true, remaining, resetTime: Math.ceil(this.windowMs / 1000) };
  }

  public reset(): void {
    this.store.clear();
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }

  public getMiddleware(customMax?: number) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "127.0.0.1";

      const effectiveMax = customMax || this.maxRequests;
      const status = this.check(ip);

      res.setHeader("X-RateLimit-Limit", effectiveMax.toString());
      res.setHeader("X-RateLimit-Remaining", status.remaining.toString());

      if (!status.allowed) {
        res.setHeader("Retry-After", status.resetTime.toString());
        res.status(429).json({
          error: "Too many requests. Please slow down and try again shortly.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfterSeconds: status.resetTime,
        });
        return;
      }

      next();
    };
  }
}

// Default instance for AI endpoints: 30 requests per minute
export const aiRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
});

// General API rate limiter: 120 requests per minute
export const apiRateLimiter = new SlidingWindowRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
});
