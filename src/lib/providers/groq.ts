// src/lib/providers/groq.ts
import { toValidationResult, type ChatParams, type Provider } from './types'

const API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile' // better quality than the 8B models
const MAX_TOKENS = 8000

async function post(params: ChatParams, key: string, streaming: boolean): Promise<Response> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: Math.min(params.maxTokens ?? MAX_TOKENS, MAX_TOKENS),
      stream: streaming,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq API error ${res.status}: ${err}`)
  }
  return res
}

async function* stream(params: ChatParams, key: string): AsyncGenerator<string> {
  const res = await post(params, key, true)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return
      try {
        const json = JSON.parse(data)
        const text = json.choices?.[0]?.delta?.content
        if (text) yield text
      } catch {
        // skip malformed chunks
      }
    }
  }
}

async function complete(params: ChatParams, key: string): Promise<string> {
  const res = await post(params, key, false)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export const groq: Provider = {
  id: 'groq',
  label: 'Groq',
  defaultModel: MODEL,
  keyConsoleUrl: 'https://console.groq.com/keys',
  freeKey: true,
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
