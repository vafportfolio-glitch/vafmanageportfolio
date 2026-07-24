export function triggerDownload(fileId: string, filename: string) {
  const a = document.createElement('a')
  a.href = `/api/files/${fileId}?mode=download`
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
