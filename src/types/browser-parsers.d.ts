// Types for the two browser-only parser entry points used by
// `src/lib/parse-resume-file.ts`. Both are real, shipped files that carry no
// declarations of their own, so they borrow the ones from their package root.

declare module 'pdfjs-dist/webpack.mjs' {
  export * from 'pdfjs-dist'
}

declare module 'mammoth/mammoth.browser' {
  import mammoth = require('mammoth')
  export default mammoth
}
