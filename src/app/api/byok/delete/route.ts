// src/app/api/byok/delete/route.ts
// Removes the signed-in user's stored key for one provider.

import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { deleteUserKey } from '@/lib/byok'
import { PROVIDERS, type ProviderId } from '@/lib/providers'

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

  const { provider } = await request.json() as { provider?: string }

  if (!provider || !VALID_PROVIDERS.includes(provider as ProviderId)) {
    return Response.json({ error: `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}` }, { status: 400 })
  }

  try {
    await deleteUserKey(user.id, provider as ProviderId)
    return Response.json({ success: true })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : 'Delete failed' }, { status: 500 })
  }
}
