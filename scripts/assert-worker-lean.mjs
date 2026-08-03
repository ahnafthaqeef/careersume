// Deploy gate: refuses to ship a Worker that has outgrown Cloudflare's free
// plan. Run after `opennextjs-cloudflare build`, before the deploy.
//
// Two independent checks, because the size number alone tells you that
// something regressed but not what:
//   1. Compressed size, with 272 KiB of margin under the real 3072 KiB limit.
//   2. pdf.js in the server bundle. The parser belongs in the browser; if the
//      webpack alias in next.config.ts stops applying (a Turbopack build, say),
//      this is the first thing to come back. "WorkerMessageHandler" appears in
//      pdf.worker and nowhere else, so it is a clean discriminator.
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const LIMIT_KIB = 2800
const CANARY = 'WorkerMessageHandler'

const out = execSync('npx wrangler deploy --dry-run', {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

const gzip = Number(out.match(/gzip:\s*([\d.]+)\s*KiB/)?.[1])
if (!gzip) throw new Error(`Could not read the gzip size from wrangler:\n${out}`)

// Everything under .open-next except `assets`, which is served as static files
// rather than uploaded as Worker code, and is where pdf.worker is meant to live.
function* serverFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (dir.endsWith('.open-next') && entry.name === 'assets') continue
      yield* serverFiles(`${dir}/${entry.name}`)
    } else {
      yield `${dir}/${entry.name}`
    }
  }
}

const leaked = [...serverFiles('.open-next')].filter((f) => readFileSync(f).includes(CANARY))

console.log(`Worker: ${gzip} KiB gzip (limit ${LIMIT_KIB} KiB, Cloudflare's cap 3072 KiB)`)
if (gzip > LIMIT_KIB) console.error(`FAIL: ${(gzip - LIMIT_KIB).toFixed(2)} KiB over the limit.`)
if (leaked.length) console.error(`FAIL: pdf.js is in the server bundle:\n  ${leaked.join('\n  ')}`)

if (gzip > LIMIT_KIB || leaked.length) process.exit(1)
console.log('Worker is lean: under the limit, and no pdf.js in the server bundle.')
