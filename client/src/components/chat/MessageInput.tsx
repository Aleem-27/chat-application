import { useState, type FormEvent } from 'react'

interface MessageInputProps {
  onSend: (content: string) => void
  onTyping: () => void
  disabled?: boolean
}

export function MessageInput({ onSend, onTyping, disabled }: MessageInputProps) {
  const [content, setContent] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) return
    onSend(trimmed)
    setContent('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 border-t border-line bg-surface px-6 py-4">
      <input
        value={content}
        onChange={(e) => {
          setContent(e.target.value)
          if (e.target.value) onTyping()
        }}
        placeholder="Write a message…"
        disabled={disabled}
        className="flex-1 rounded-full border border-line bg-canvas px-4 py-2 text-ink outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={disabled || !content.trim()}
        className="rounded-full bg-accent px-5 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        Send
      </button>
    </form>
  )
}