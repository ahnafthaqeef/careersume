// src/lib/providers/openai.ts
import { toValidationResult, type ChatParams, type Provider } from './types'

const MODEL = 'gpt-4o-mini'
const MAX_TOKENS = 16000

async function getClient(key: string) {
  const { default: OpenAI } = await import('openai')
  return new OpenAI({ apiKey: key })
}

function messages(params: ChatParams) {
  return [
    { role: 'system' as const, content: params.system },
    { role: 'user' as const, content: params.user },
  ]
}

async function* stream(params: ChatParams, key: string): AsyncGenerator<string> {
  const client = await getClient(key)
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: Math.min(params.maxTokens ?? MAX_TOKENS, MAX_TOKENS),
    stream: true,
    messages: messages(params),
  })
  for await (const chunk of completion) {
    const text = chunk.choices[0]?.delta?.content
    if (text) yield text
  }
}

async function complete(params: ChatParams, key: string): Promise<string> {
  const client = await getClient(key)
  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: Math.min(params.maxTokens ?? MAX_TOKENS, MAX_TOKENS),
    messages: messages(params),
  })
  return res.choices[0]?.message?.content ?? ''
}

export const openai: Provider = {
  id: 'openai',
  label: 'OpenAI',
  defaultModel: MODEL,
  keyConsoleUrl: 'https://platform.openai.com/api-keys',
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
