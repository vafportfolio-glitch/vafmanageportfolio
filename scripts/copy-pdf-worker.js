// Keeps the local pdf.js worker (served from /public so PDFs render fully
// in-app, with no third-party CDN request) in sync with the installed
// pdfjs-dist version that react-pdf depends on.
const fs = require('fs')
const path = require('path')

const src = path.join(__dirname, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const dest = path.join(__dirname, '..', 'public', 'pdf.worker.min.mjs')

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest)
}
