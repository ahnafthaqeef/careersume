// src/lib/byok.ts
// BYOK key encryption + persistence helpers. Server-only (uses node:crypto).

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { adminClient } from '@/lib/supabase/admin'
import type { ProviderId } from '@/lib/providers'

/** The stored `provider` column always holds an id from the adapter registry. */
export type Provider = ProviderId

const ALGO = 'aes-256-gcm'
const IV_BYTES = 12

function getKey(): Buffer {
  const secret = process.env.BYOK_ENCRYPTION_KEY
  if (!secret || secret.length < 16) {
    throw new Error('BYOK_ENCRYPTION_KEY must be set to a string of at least 16 chars')
  }
  // scrypt derives a deterministic 32-byte key from the secret + a fixed app salt
  return scryptSync(secret, 'careersume-byok-v1', 32)
}

export function encryptKey(plaintext: string): { encrypted_key: string; iv: string; auth_tag: string } {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    encrypted_key: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    auth_tag: cipher.getAuthTag().toString('base64'),
  }
}

export function decryptKey(record: { encrypted_key: string; iv: string; auth_tag: string }): string {
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(record.iv, 'base64'))
  decipher.setAuthTag(Buffer.from(record.auth_tag, 'base64'))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(record.encrypted_key, 'base64')),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

export async function saveUserKey(userId: string, provider: Provider, plaintextKey: string): Promise<void> {
  const enc = encryptKey(plaintextKey)
  const { error } = await adminClient.from('user_api_keys').upsert(
    {
      user_id: userId,
      provider,
      encrypted_key: enc.encrypted_key,
      iv: enc.iv,
      auth_tag: enc.auth_tag,
      last_validated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,provider' }
  )
  if (error) throw new Error(`Failed to save BYOK key: ${error.message}`)
}

export async function getUserKey(userId: string): Promise<{ provider: Provider; key: string } | null> {
  const { data, error } = await adminClient
    .from('user_api_keys')
    .select('provider, encrypted_key, iv, auth_tag')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  try {
    const key = decryptKey({
      encrypted_key: data.encrypted_key as string,
      iv: data.iv as string,
      auth_tag: data.auth_tag as string,
    })
    return { provider: data.provider as Provider, key }
  } catch {
    return null
  }
}

export async function deleteUserKey(userId: string, provider: Provider): Promise<void> {
  const { error } = await adminClient
    .from('user_api_keys')
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider)
  if (error) throw new Error(`Failed to delete BYOK key: ${error.message}`)
}
