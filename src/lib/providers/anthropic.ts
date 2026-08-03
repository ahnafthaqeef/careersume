// src/lib/providers/anthropic.ts
import { toValidationResult, type ChatParams, type Provider } from './types'

const MODEL = 'claude-sonnet-4-5'
const MAX_TOKENS = 16000

async function getClient(key: string) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  return new Anthropic({ apiKey: key })
}

async function* stream(params: ChatParams, key: string): AsyncGenerator<string> {
  const client = await getClient(key)
  const events = client.messages.stream({
    model: MODEL,
    max_tokens: Math.min(params.maxTokens ?? MAX_TOKENS, MAX_TOKENS),
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  })
  for await (const event of events) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

async function complete(params: ChatParams, key: string): Promise<string> {
  const client = await getClient(key)
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: Math.min(params.maxTokens ?? MAX_TOKENS, MAX_TOKENS),
    system: params.system,
    messages: [{ role: 'user', content: params.user }],
  })
  return res.content[0]?.type === 'text' ? res.content[0].text : ''
}

export const anthropic: Provider = {
  id: 'anthropic',
  label: 'Anthropic Claude',
  defaultModel: MODEL,
  keyConsoleUrl: 'https://console.anthropic.com/settings/keys',
  freeKey: false,
  stream,
  complete,
  async validateKey(key: string) {
    try {
      await complete({ system: 'Reply with OK.', user: 'ping', maxTokens: 1 }, key)
      return { ok: true }
    } catch (error) {
      return toValidationResult(error)
    }
  },
}
