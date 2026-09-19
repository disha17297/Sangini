import crypto from "crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T = any> {
  private store: Map<string, CacheEntry<T>>;
  private maxEntries: number;
  private defaultTtlMs: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(options: { maxEntries?: number; defaultTtlMs?: number } = {}) {
    this.maxEntries = options.maxEntries || 250;
    this.defaultTtlMs = options.defaultTtlMs || 60 * 60 * 1000; // 1 hour default
    this.store = new Map();
  }

  public generateKey(prefix: string, payload: any): string {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
    return `${prefix}:${hash}`;
  }

  public get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    // Refresh position for LRU
    this.store.delete(key);
    this.store.set(key, entry);

    this.hits++;
    return entry.value;
  }

  public set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTtlMs);

    // Evict oldest if limit reached
    if (this.store.size >= this.maxEntries) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, { value, expiresAt });
  }

  public has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  public clear(): void {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  public size(): number {
    return this.store.size;
  }

  public getStats() {
    return {
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)).toFixed(2) : "0.00",
    };
  }
}

// Global server caches
export const scamCache = new MemoryCache({ maxEntries: 300, defaultTtlMs: 2 * 60 * 60 * 1000 });
export const docCache = new MemoryCache({ maxEntries: 200, defaultTtlMs: 2 * 60 * 60 * 1000 });
export const medCache = new MemoryCache({ maxEntries: 500, defaultTtlMs: 24 * 60 * 60 * 1000 });
