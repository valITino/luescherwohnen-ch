// Einfache Ratenbegrenzung im Speicher (gleitendes Fenster je Schlüssel).
export function createRateLimiter({ limit, windowMs }) {
  const buckets = new Map();
  function prune(now) {
    for (const [key, times] of buckets) {
      const fresh = times.filter((t) => now - t < windowMs);
      if (fresh.length === 0) buckets.delete(key);
      else buckets.set(key, fresh);
    }
  }
  return {
    allow(key, now = Date.now()) {
      if (buckets.size > 10_000) prune(now);
      const times = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
      if (times.length >= limit) {
        buckets.set(key, times);
        return false;
      }
      times.push(now);
      buckets.set(key, times);
      return true;
    },
    size() {
      return buckets.size;
    },
  };
}
