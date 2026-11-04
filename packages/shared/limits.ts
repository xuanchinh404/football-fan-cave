export class RateLimiter {
  private buckets = new Map<string, { tokens: number; at: number }>();
  constructor(
    private capacity: number,
    private interval: number,
  ) {}
  allow(key: string, now = Date.now()) {
    const prev = this.buckets.get(key) ?? { tokens: this.capacity, at: now };
    const tokens = Math.min(
      this.capacity,
      prev.tokens + ((now - prev.at) * this.capacity) / this.interval,
    );
    if (tokens < 1) {
      this.buckets.set(key, { tokens, at: now });
      return false;
    }
    this.buckets.set(key, { tokens: tokens - 1, at: now });
    return true;
  }
  delete(key: string) {
    this.buckets.delete(key);
  }
}
