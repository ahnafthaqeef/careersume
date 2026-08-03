// src/lib/providers/index.ts
// Registry of BYOK provider adapters. Gemini is listed first because it is the
// recommended starting point: a free key, no card required.

import { anthropic } from './anthropic'
import { gemini } from './gemini'
import { groq } from './groq'
import { openai } from './openai'
import type { Provider, ProviderId } from './types'

export type { ChatParams, Provider, ProviderId, ValidationResult } from './types'

export const PROVIDERS: Provider[] = [gemini, groq, openai, anthropic]

export function getProvider(id: ProviderId): Provider {
  const provider = PROVIDERS.find((p) => p.id === id)
  if (!provider) throw new Error(`Unknown AI provider: ${id}`)
  return provider
}

/** Everything the key wizard needs to describe a provider, minus the adapter. */
export interface ProviderCard {
  id: ProviderId
  label: string
  defaultModel: string
  keyConsoleUrl: string
  freeKey: boolean
}

/**
 * Serializable view of the registry, for passing from a server page into the
 * client wizard. Importing PROVIDERS itself into a client component would drag
 * every provider SDK into the browser bundle.
 */
export function providerCards(): ProviderCard[] {
  return PROVIDERS.map(({ id, label, defaultModel, keyConsoleUrl, freeKey }) => ({
    id,
    label,
    defaultModel,
    keyConsoleUrl,
    freeKey,
  }))
}
