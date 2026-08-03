// src/app/api/byok/test/route.ts
// Validates a user-provided AI key with a tiny test prompt.

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getProvider, PROVIDERS, type ProviderId } from '@/lib/providers'

const VALID_PROVIDERS = PROVIDERS.map((p) => p.id)

export async function POST(request: NextRequest) {
  // Auth
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { provider, key } = await request.json() as { provider?: string; key?: string }

  if (!provider || !VALID_PROVIDERS.includes(provider as ProviderId)) {
    return Response.json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` }, { status: 400 })
  }
  if (!key || typeof key !== 'string' || key.length < 10) {
    return Response.json({ error: 'Invalid key' }, { status: 400 })
  }

  // `rejected` comes from the adapter's own error mapping, so the client never
  // has to guess a bad key from an unreachable provider by reading strings.
  const result = await getProvider(provider as ProviderId).validateKey(key)
  return Response.json({ ok: result.ok, rejected: result.rejected === true, error: result.error })
}
