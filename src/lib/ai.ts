// src/lib/ai.ts
// Thin façade over the provider adapters. Careersume is BYOK-only: every call
// runs on the key the signed-in user connected, and no provider key is ever
// read from the environment.

import { getUserKey } from '@/lib/byok'
import { getProvider } from '@/lib/providers'
import type { ChatParams, Provider, ProviderId } from '@/lib/providers'

/** Optional out-param: callers that log usage need the id that actually ran. */
export interface ResolvedProvider {
  id?: ProviderId
}

export class NoKeyError extends Error {
  constructor() {
    super('Connect your AI key to continue.')
    this.name = 'NoKeyError'
  }
}

async function resolveProvider(userId: string): Promise<{ provider: Provider; key: string }> {
  const userKey = await getUserKey(userId)
  if (!userKey) throw new NoKeyError()
  return { provider: getProvider(userKey.provider), key: userKey.key }
}

/** Streams text from the user's own provider. Throws NoKeyError if none is connected. */
export async function* streamForUser(
  userId: string,
  params: ChatParams,
  resolved?: ResolvedProvider
): AsyncGenerator<string> {
  const { provider, key } = await resolveProvider(userId)
  if (resolved) resolved.id = provider.id
  yield* provider.stream(params, key)
}

/** One-shot completion from the user's own provider. Throws NoKeyError if none is connected. */
export async function completeForUser(
  userId: string,
  params: ChatParams,
  resolved?: ResolvedProvider
): Promise<string> {
  const { provider, key } = await resolveProvider(userId)
  if (resolved) resolved.id = provider.id
  return provider.complete(params, key)
}
