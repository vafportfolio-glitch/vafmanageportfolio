export function isImage(mime: string) { return mime.startsWith('image/') }
export function isPdf(mime: string) { return mime === 'application/pdf' }
export function isSpreadsheet(mime: string) {
  return mime.includes('spreadsheet') || mime.includes('excel') || mime === 'text/csv'
}
