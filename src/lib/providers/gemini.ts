// src/lib/providers/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import { toValidationResult, type ChatParams, type Provider } from './types'

const MODEL = 'gemini-2.0-flash'
const MAX_TOKENS = 8192 // model ceiling for gemini-2.0-flash

function getModel(params: ChatParams, key: string) {
  const genAI = new GoogleGenerativeAI(key)
  return genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: params.system,
    generationConfig: { maxOutputTokens: Math.min(params.maxTokens ?? MAX_TOKENS, MAX_TOKENS) },
  })
}

async function* stream(params: ChatParams, key: string): AsyncGenerator<string> {
  const result = await getModel(params, key).generateContentStream(params.user)
  for await (const chunk of result.stream) {
    yield chunk.text()
  }
}

async function complete(params: ChatParams, key: string): Promise<string> {
  const result = await getModel(params, key).generateContent(params.user)
  return result.response.text()
}

export const gemini: Provider = {
  id: 'gemini',
  label: 'Google Gemini',
  defaultModel: MODEL,
  keyConsoleUrl: 'https://aistudio.google.com/apikey',
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
