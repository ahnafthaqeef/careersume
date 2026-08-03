// src/lib/parse-resume-file.ts
// Turns a dropped resume file into plain text, in the browser. The file itself
// never leaves the user's machine; only the text they go on to approve is sent
// anywhere. Both parsers are imported lazily, so a visitor who never drops a
// file never downloads them.

/** Same cap the old /api/parse-profile endpoint enforced server-side. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  // `pdfjs-dist/webpack.mjs` is the package's own bundler entry: it starts the
  // PDF worker from a URL the bundler emits into our own assets, so nothing is
  // fetched from a CDN and a strict CSP still passes.
  const pdfjs = await import('pdfjs-dist/webpack.mjs')
  const task = pdfjs.getDocument({ data })
  try {
    const doc = await task.promise
    const pages: string[] = []
    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()
      // `hasEOL` is how pdf.js reports a line break, and resume layout carries
      // real meaning for the model reading it later, so keep the lines.
      pages.push(
        content.items
          .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
          .join('')
      )
    }
    return pages.join('\n\n')
  } finally {
    // Tears down the worker this document spun up, whether or not it parsed.
    await task.destroy()
  }
}

async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  // The prebuilt browser bundle, not the package's node entry: that one reaches
  // for `fs` and `Buffer`.
  const mammoth = (await import('mammoth/mammoth.browser')).default
  const result = await mammoth.extractRawText({ arrayBuffer })
  return result.value
}

/**
 * Extracts the text of a PDF, DOCX, or TXT resume. Every thrown message is
 * copy that can be shown to the user as-is.
 */
export async function parseResumeFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File too large. Maximum size is 5MB.')
  }

  const name = file.name.toLowerCase()
  const isPdf = file.type === 'application/pdf' || name.endsWith('.pdf')
  const isDocx = file.type === DOCX_MIME || name.endsWith('.docx')
  const isTxt = file.type === 'text/plain' || name.endsWith('.txt')

  if (!isPdf && !isDocx && !isTxt) {
    throw new Error('Unsupported file type. Please upload a PDF, DOCX, or TXT file.')
  }

  let text: string
  try {
    if (isPdf) {
      text = await extractPdfText(await file.arrayBuffer())
    } else if (isDocx) {
      text = await extractDocxText(await file.arrayBuffer())
    } else {
      text = await file.text()
    }
  } catch (err) {
    // A corrupt or password-protected file lands here; the user gets the
    // friendly line and the detail stays in the console.
    console.error('Profile parse error:', err)
    throw new Error('Failed to parse file. Please try again.')
  }

  if (!text.trim()) {
    throw new Error('Could not extract text from the file. Please try a different file.')
  }
  return text.trim()
}
