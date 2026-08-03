// src/app/api/byok/save/route.ts
// Saves an encrypted user-provided AI key to Supabase.

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { saveUserKey } from '@/lib/byok'
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

  // Re-validate before saving to catch typos / revoked keys
  const validation = await getProvider(provider as ProviderId).validateKey(key)
  if (!validation.ok) {
    return Response.json(
      { error: validation.error ?? 'Key failed validation. Check the value and try again.' },
      { status: 400 }
    )
  }

  try {
    await saveUserKey(user.id, provider as ProviderId, key)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Save failed' }, { status: 500 })
  }
}
