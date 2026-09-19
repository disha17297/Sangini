import { describe, it, expect, beforeEach } from "vitest";
import { SlidingWindowRateLimiter } from "../server/rateLimiter";

describe("SlidingWindowRateLimiter", () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(() => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 1000, // 1 second for fast testing
      maxRequests: 3,
    });
  });

  it("should allow requests under the limit", () => {
    const ip = "192.168.1.100";
    const res1 = limiter.check(ip);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check(ip);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check(ip);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block requests exceeding max limit", () => {
    const ip = "10.0.0.5";
    limiter.check(ip);
    limiter.check(ip);
    limiter.check(ip);

    // 4th request must be blocked
    const res4 = limiter.check(ip);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetTime).toBeGreaterThanOrEqual(1);
  });

  it("should track distinct IPs independently", () => {
    const ipA = "1.1.1.1";
    const ipB = "2.2.2.2";

    limiter.check(ipA);
    limiter.check(ipA);
    limiter.check(ipA);
    expect(limiter.check(ipA).allowed).toBe(false);

    // ipB should still be allowed
    expect(limiter.check(ipB).allowed).toBe(true);
  });

  it("should reset properly when reset() is called", () => {
    const ip = "192.168.1.1";
    limiter.check(ip);
    limiter.check(ip);
    limiter.check(ip);
    expect(limiter.check(ip).allowed).toBe(false);

    limiter.reset();
    expect(limiter.check(ip).allowed).toBe(true);
  });
});
