// In-memory rate limiter using a sliding window
// 10 requests per minute per IP

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 10;

interface RateLimitData {
  timestamps: number[];
}

const store = new Map<string, RateLimitData>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  let data = store.get(ip);
  if (!data) {
    data = { timestamps: [] };
    store.set(ip, data);
  }

  // Filter out old requests
  data.timestamps = data.timestamps.filter((t) => t > windowStart);

  if (data.timestamps.length >= MAX_REQUESTS) {
    return false; // Rate limited
  }

  data.timestamps.push(now);
  return true;
}

export function resetRateLimit(): void {
  store.clear();
}
