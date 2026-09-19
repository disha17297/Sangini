import { describe, it, expect, beforeEach } from "vitest";
import { MemoryCache } from "../server/cache";

describe("MemoryCache (LRU & TTL)", () => {
  let cache: MemoryCache<any>;

  beforeEach(() => {
    cache = new MemoryCache({
      maxEntries: 3,
      defaultTtlMs: 2000,
    });
  });

  it("should store and retrieve cached values", () => {
    cache.set("key1", { data: "test-data" });
    const result = cache.get("key1");
    expect(result).toEqual({ data: "test-data" });
  });

  it("should return null for non-existent keys", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("should evict the oldest entry when maxEntries is exceeded (LRU)", () => {
    cache.set("k1", 1);
    cache.set("k2", 2);
    cache.set("k3", 3);

    // Access k1 to make it most recently used
    cache.get("k1");

    // Add k4 -> should evict k2 (oldest)
    cache.set("k4", 4);

    expect(cache.get("k1")).toBe(1);
    expect(cache.get("k2")).toBeNull(); // Evicted!
    expect(cache.get("k3")).toBe(3);
    expect(cache.get("k4")).toBe(4);
  });

  it("should expire items when TTL passes", async () => {
    cache.set("shortKey", "val", 10); // 10ms TTL

    // Wait 25ms
    await new Promise((r) => setTimeout(r, 25));

    expect(cache.get("shortKey")).toBeNull();
    expect(cache.has("shortKey")).toBe(false);
  });

  it("should generate deterministic SHA-256 slice keys", () => {
    const key1 = cache.generateKey("scam", { text: "urgent electricity unpaid" });
    const key2 = cache.generateKey("scam", { text: "urgent electricity unpaid" });
    const key3 = cache.generateKey("scam", { text: "different text" });

    expect(key1).toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key1.startsWith("scam:")).toBe(true);
  });

  it("should track cache stats (hits, misses, hitRatio)", () => {
    cache.set("itemA", "valA");
    cache.get("itemA"); // Hit
    cache.get("itemA"); // Hit
    cache.get("itemB"); // Miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
    expect(parseFloat(stats.hitRatio)).toBeCloseTo(0.67, 1);
  });
});
