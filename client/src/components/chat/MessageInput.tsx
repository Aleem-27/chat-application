import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { useFileUpload } from '@/hooks/useFileUpload'
import { AttachmentMenu, type AttachmentKind } from './AttachmentMenu'
import type { FileUploadResponse } from '@/types/files'

interface MessageInputProps {
  onSend: (content: string) => void
  onSendFile: (file: FileUploadResponse) => void
  onTyping: () => void
  disabled?: boolean
}

const ACCEPT_BY_KIND: Record<AttachmentKind, string> = {
  image: 'image/*',
  video: 'video/*',
  document: '.pdf,.docx,.xlsx,.txt',
  file: '.zip,.pdf,.docx,.xlsx,.txt,image/*,video/*',
}

export function MessageInput({ onSend, onSendFile, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const upload = useFileUpload()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
  }

  function openPicker(kind: AttachmentKind) {
    setMenuOpen(false)
    const input = fileInputRef.current
    if (!input) return
    input.accept = ACCEPT_BY_KIND[kind] // set just before opening so the OS dialog filters correctly
    input.click()
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-selecting the same file later
    if (!file) return

    upload.mutate(file, {
      onSuccess: (result) => onSendFile(result),
    })
  }

  const isBusy = disabled || upload.isPending

  return (
    <div className="border-t border-line bg-surface px-6 py-4">
      {upload.isError && (
        <p className="mb-2 text-sm text-red-600">Upload failed. Try a smaller file or a different type.</p>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative">
          {menuOpen && <AttachmentMenu onSelect={openPicker} onClose={() => setMenuOpen(false)} />}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            disabled={isBusy}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            aria-label="Attach a file"
          >
            <Plus size={18} />
          </button>
        </div>

        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

        <input
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            if (e.target.value) onTyping()
          }}
          placeholder={upload.isPending ? 'Uploading…' : 'Write a message…'}
          disabled={isBusy}
          className="flex-1 rounded-full border border-line bg-canvas px-4 py-2 text-ink outline-none focus:border-accent"
        />

        <button
          type="submit"
          disabled={isBusy || !content.trim()}
          className="rounded-full bg-accent px-5 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}