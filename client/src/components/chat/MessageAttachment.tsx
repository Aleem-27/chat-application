import { FileText } from 'lucide-react'
import { formatFileSize, resolveFileUrl } from '@/lib/files'

interface MessageAttachmentProps {
  fileUrl: string
  fileName: string
  fileSizeBytes: number
  fileContentType: string
}

export function MessageAttachment({
  fileUrl,
  fileName,
  fileSizeBytes,
  fileContentType,
}: MessageAttachmentProps) {
  const url = resolveFileUrl(fileUrl)

  if (fileContentType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img src={url} alt={fileName} className="max-h-64 rounded-lg object-cover" />
      </a>
    )
  }

  if (fileContentType.startsWith('video/')) {
    return <video src={url} controls className="max-h-64 rounded-lg" />
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2 transition-colors hover:bg-accent-tint"
    >
      <FileText size={20} className="shrink-0 text-accent" />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{fileName}</p>
        <p className="text-xs text-ink-soft">{formatFileSize(fileSizeBytes)}</p>
      </div>
    </a>
  )
}