// src/lib/providers/types.ts
// Contract every BYOK provider adapter implements. Keys are always supplied by
// the user at call time; adapters never read provider keys from the environment.

export type ProviderId = 'gemini' | 'openai' | 'anthropic' | 'groq'

export interface ChatParams {
  system: string
  user: string
  maxTokens?: number
}

export interface ValidationResult {
  ok: boolean
  /** True only when the provider itself refused the credential, so callers can
   *  tell "your key is wrong" apart from "we could not reach the provider". */
  rejected?: boolean
  error?: string
}

export interface Provider {
  id: ProviderId
  label: string
  defaultModel: string
  keyConsoleUrl: string // where users create a key
  freeKey: boolean // true for gemini + groq (no card required)
  validateKey(key: string): Promise<ValidationResult>
  stream(params: ChatParams, key: string): AsyncGenerator<string>
  complete(params: ChatParams, key: string): Promise<string>
}

const REJECTED = 'That key was rejected by the provider.'

/**
 * Maps a failed validation call to a user-facing result. Auth failures (HTTP
 * 401/403, plus Gemini's 400 "API key not valid") mean the key itself is bad;
 * anything else is passed through so the user can see what actually broke.
 */
export function toValidationResult(error: unknown): ValidationResult {
  const status = (error as { status?: unknown })?.status
  const message = error instanceof Error ? error.message : String(error)
  if (
    status === 401 ||
    status === 403 ||
    /\b(401|403)\b/.test(message) ||
    /api[_ ]key not valid|invalid api key/i.test(message)
  ) {
    return { ok: false, rejected: true, error: REJECTED }
  }
  return { ok: false, rejected: false, error: message.slice(0, 200) }
}
