'use client'

import { useRef, useState } from 'react'
import { withBasePath } from '@/lib/basePath'

type FeedbackType = 'bug' | 'idea' | 'other'

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug',
  idea: 'Idea',
  other: 'Other',
}

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper'

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function reset() {
    setMessage('')
    setFile(null)
    setType('bug')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const fd = new FormData()
    fd.append('type', type)
    fd.append('message', message)
    fd.append('page_url', window.location.href)
    if (file) fd.append('screenshot', file)

    try {
      await fetch(withBasePath('/api/feedback'), { method: 'POST', body: fd })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setIsOpen(false)
        reset()
      }, 2000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 ${FOCUS}`}
        >
          Feedback
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-md border border-line bg-surface p-6 shadow-paper">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ink">Send feedback</span>
            <button
              onClick={() => { setIsOpen(false); reset() }}
              className={`rounded text-[15px] leading-none text-ink-3 transition-colors duration-200 hover:text-ink ${FOCUS}`}
              aria-label="Close feedback"
            >
              ✕
            </button>
          </div>

          {success ? (
            <p className="py-8 text-center text-[15px] text-ink-2">Thanks for the feedback.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3 flex gap-2">
                {(Object.keys(TYPE_LABELS) as FeedbackType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-md border py-2 text-[13px] font-semibold transition-colors duration-200 ${FOCUS} ${
                      type === t
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-line text-ink-2 hover:border-ink'
                    }`}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what happened or what you would love to see..."
                maxLength={2000}
                required
                className="mb-3 h-24 w-full resize-none rounded-md border border-line bg-paper px-3 py-2 text-[14px] text-ink placeholder:text-ink-3 focus:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-surface"
              />

              <label className="mb-3 flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-[13px] text-ink-3 transition-colors duration-200 hover:border-ink">
                {file ? file.name : 'Attach a screenshot (optional, max 5MB)'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className={`w-full rounded-md bg-ink py-2.5 text-[14px] font-semibold text-paper transition-colors duration-200 hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
              >
                {loading ? 'Sending...' : 'Send feedback'}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
