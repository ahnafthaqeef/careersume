// src/lib/usage.ts
// Quiet daily caps for endpoints that consume OUR infra (scraping, parsing).
// Resume generation itself is BYOK and never limited by this.

import { adminClient } from '@/lib/supabase/admin'

export type UsageEndpoint = 'fetch-job-url' | 'search-jobs' | 'parse-profile'

export async function checkAndIncrementUsage(
  userId: string,
  endpoint: UsageEndpoint,
  limit: number
): Promise<{ allowed: boolean; used: number }> {
  const { data, error } = await adminClient.rpc('increment_usage', {
    p_user: userId,
    p_endpoint: endpoint,
  })

  if (error) {
    // Fail open: a Supabase hiccup should not block a legitimate user.
    // These are quiet anti-abuse caps, not a billing gate.
    console.warn(`[usage] increment_usage failed for ${endpoint}, failing open:`, error.message)
    return { allowed: true, used: 0 }
  }

  const used = data as number
  return { allowed: used <= limit, used }
}
