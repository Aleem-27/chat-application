export function resolveFileUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${import.meta.env.VITE_API_URL}${path}`
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}