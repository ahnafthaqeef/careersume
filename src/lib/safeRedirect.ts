// src/lib/safeRedirect.ts

/**
 * A redirect target that arrived in a query param can be an absolute URL, so
 * only same-origin relative paths are ever followed: one leading slash, and
 * the character after it may not be another slash or a backslash. Both
 * "//evil.com" and "/\evil.com" are protocol-relative URLs rather than paths,
 * and browsers treat the two the same. Control characters are rejected
 * anywhere in the string, because a browser strips them before parsing, so
 * "/\t/evil.com" would resolve off-origin as well.
 */
const SAFE = /^\/(?![/\\])[^\x00-\x1f\x7f]*$/;

export function safeRelativePath(next: string | null | undefined, fallback: string): string {
  return next && SAFE.test(next) ? next : fallback;
}
