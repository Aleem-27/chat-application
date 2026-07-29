import { FileText, Image as ImageIcon, Paperclip, Video } from 'lucide-react'

export type AttachmentKind = 'image' | 'video' | 'document' | 'file'

interface AttachmentMenuProps {
  onSelect: (kind: AttachmentKind) => void
  onClose: () => void
}

const OPTIONS: { kind: AttachmentKind; label: string; icon: typeof ImageIcon }[] = [
  { kind: 'image', label: 'Image', icon: ImageIcon },
  { kind: 'video', label: 'Video', icon: Video },
  { kind: 'document', label: 'Document', icon: FileText },
  { kind: 'file', label: 'File', icon: Paperclip },
]

export function AttachmentMenu({ onSelect, onClose }: AttachmentMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute bottom-full left-0 z-20 mb-2 w-44 overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
        {OPTIONS.map(({ kind, label, icon: Icon }) => (
          <button
            key={kind}
            type="button"
            onClick={() => onSelect(kind)}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:bg-accent-tint"
          >
            <Icon size={16} className="text-accent" />
            {label}
          </button>
        ))}
      </div>
    </>
  )
}