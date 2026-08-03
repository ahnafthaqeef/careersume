// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const type = formData.get('type') as string
  const message = formData.get('message') as string
  const pageUrl = formData.get('page_url') as string | null
  const screenshot = formData.get('screenshot') as File | null

  if (!['bug', 'idea', 'other'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }
  if (!message || message.length > 2000) {
    return NextResponse.json({ error: 'Message required (max 2000 chars)' }, { status: 400 })
  }

  let screenshotUrl: string | null = null
  const feedbackId = crypto.randomUUID()

  if (screenshot && screenshot.size > 0) {
    if (screenshot.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Screenshot too large (max 5MB)' }, { status: 400 })
    }
    if (!ALLOWED_MIME.includes(screenshot.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }
    const ext = screenshot.name.split('.').pop() ?? 'png'
    const path = `${user.id}/${feedbackId}.${ext}`
    const bytes = await screenshot.arrayBuffer()

    const { error: uploadErr } = await adminClient.storage
      .from('feedback-screenshots')
      .upload(path, bytes, { contentType: screenshot.type })

    if (!uploadErr) {
      const { data: signed } = await adminClient.storage
        .from('feedback-screenshots')
        .createSignedUrl(path, 3600)
      screenshotUrl = signed?.signedUrl ?? null
    }
  }

  const { error: dbErr } = await adminClient.from('feedback').insert({
    id: feedbackId,
    user_id: user.id,
    type,
    message,
    screenshot_url: screenshotUrl,
    page_url: pageUrl ?? null,
  })

  if (dbErr) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  await notifyTelegram({
    type,
    message,
    pageUrl: pageUrl ?? 'unknown',
    screenshotUrl,
    userEmail: user.email ?? 'unknown',
  })

  return NextResponse.json({ success: true })
}

async function notifyTelegram({
  type, message, pageUrl, screenshotUrl, userEmail,
}: {
  type: string
  message: string
  pageUrl: string
  screenshotUrl: string | null
  userEmail: string
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_FEEDBACK_CHAT_ID
  if (!token || !chatId) return

  const text = `[${type.toUpperCase()}] from ${userEmail}\nPage: ${pageUrl}\n\n${message}`

  if (screenshotUrl) {
    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: screenshotUrl, caption: text }),
    }).catch(() => {})
  } else {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch(() => {})
  }
}
