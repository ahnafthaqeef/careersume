import { checkRateLimit } from '@/lib/rate-limit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const result = checkRateLimit('test-key-allow', 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.retryAfter).toBeUndefined()
  })

  it('blocks requests that exceed the limit', () => {
    const key = 'test-key-block'
    // Hit the limit (default maxRequests = 10, but we pass 3 here)
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, 3, 60_000)
    }
    // 4th request should be blocked
    const result = checkRateLimit(key, 3, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('uses different buckets per key', () => {
    const r1 = checkRateLimit('bucket-a', 5, 60_000)
    const r2 = checkRateLimit('bucket-b', 5, 60_000)
    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
  })
})
