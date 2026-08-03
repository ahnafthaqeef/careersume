// Simple in-memory rate limiter. Resets per server instance (sufficient for single-user / small-scale use).
const store = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const cutoff = now - windowMs
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff)
  hits.push(now)
  store.set(key, hits)

  if (hits.length > maxRequests) {
    const retryAfter = Math.ceil((hits[0] + windowMs - now) / 1000)
    return { allowed: false, retryAfter }
  }
  return { allowed: true }
}
