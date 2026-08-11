// The app is served under a prefix (`/careersume` on univa.my), and Next only
// applies that prefix to the navigation it owns: <Link href>, router.push, and
// the next/image loader. A URL the app builds itself is left alone, so a plain
// fetch("/api/profile") would leave the app and hit the root of univa.my, which
// is a different site. Every hand-built internal URL goes through here.
//
// The value comes from `basePath` in next.config.ts, inlined into both bundles
// at build time. It is empty under Jest, which runs no webpack pass, so tests
// keep asserting on the plain app-relative paths.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Turns an app-relative path ("/api/profile") into one the browser can request. */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
