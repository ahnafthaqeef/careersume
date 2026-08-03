import type { NextConfig } from "next";

// The alias below is a webpack-only escape hatch, and Turbopack ignores unknown
// webpack config silently rather than failing. A Turbopack build would therefore
// look fine and ship a Worker roughly 900 KB heavier, over Cloudflare's limit.
// The Next CLI sets TURBOPACK before it loads this file, so fail loudly instead.
if (process.env.TURBOPACK) {
  throw new Error(
    "Careersume must build with webpack, not Turbopack. next.config.ts keeps pdfjs-dist and mammoth " +
    "out of the Worker with a webpack-only resolve.alias that Turbopack ignores, which puts ~900 KB " +
    "back into the bundle and breaks Cloudflare's 3 MB free-plan limit. Drop the --turbopack flag."
  );
}

const nextConfig: NextConfig = {
  // `src/lib/parse-resume-file.ts` pulls pdfjs-dist and mammoth in lazily, from a
  // "use client" component. A client component is still compiled into the server
  // graph for SSR, so without this both libraries ride along into the Worker
  // bundle, roughly 900 KB of code that can never run there: parsing only ever
  // happens in a browser event handler. Resolving them to an empty module on the
  // server keeps the Worker inside the 3 MB free-plan limit.
  //
  // This hook runs under webpack only. Turbopack has no equivalent of
  // `resolve.alias: false` and would drop the exclusion without a word, which is
  // what the guard above exists to prevent. `scripts/assert-worker-lean.mjs` is
  // the backstop that measures the result before a deploy goes out.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdfjs-dist/webpack.mjs$": false,
        "mammoth/mammoth.browser$": false,
      };
    }
    return config;
  },
};

export default nextConfig;
