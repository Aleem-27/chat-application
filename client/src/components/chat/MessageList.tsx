import { useEffect, useRef, useState } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import { ContextMenu } from '@/components/shared/ContextMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { MessageAttachment } from './MessageAttachment'
import { ReadReceiptTick } from './ReadReceiptTick'
import type { GroupMember, Message } from '@/types/chat'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  members: GroupMember[]
  readBy: Map<number, Set<string>>
  onEdit: (messageId: number, content: string) => void
  onDelete: (messageId: number) => void
}

const GROUP_GAP_MINUTES = 5

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageList({
  messages,
  currentUserId,
  members,
  readBy,
  onEdit,
  onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; message: Message } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Message | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  function startEdit(message: Message) {
    setEditingId(message.id)
    setEditValue(message.content ?? '')
  }

  function submitEdit(messageId: number) {
    const trimmed = editValue.trim()
    if (trimmed) onEdit(messageId, trimmed)
    setEditingId(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4 md:px-6">
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId
        const previous = messages[index - 1]

        const isGrouped =
          !!previous &&
          previous.senderId === message.senderId &&
          (new Date(message.sentAt).getTime() - new Date(previous.sentAt).getTime()) / 60000 
            GROUP_GAP_MINUTES

        const showTime =
          !previous ||
          previous.senderId !== message.senderId ||
          formatTime(message.sentAt) !== formatTime(previous.sentAt)

        const isEditing = editingId === message.id

        const bodyContent = message.isDeleted ? (
          <p className={`italic ${isOwn ? 'text-white/60' : 'text-ink-soft'}`}>This message was deleted</p>
        ) : isEditing ? (
          <div className="flex flex-col gap-1.5">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitEdit(message.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              className={`rounded-md border px-2 py-1 text-sm outline-none ${
                isOwn
                  ? 'border-white/30 bg-white/10 text-white focus:border-white'
                  : 'border-line bg-surface text-ink focus:border-accent'
              }`}
            />
            <div className="flex gap-2 text-xs">
              <button onClick={() => submitEdit(message.id)} className="font-medium underline">
                Save
              </button>
              <button onClick={() => setEditingId(null)} className="opacity-70 underline">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.fileUrl && message.fileName && message.fileSizeBytes && message.fileContentType && (
              <div className="mb-2">
                <MessageAttachment
                  fileUrl={message.fileUrl}
                  fileName={message.fileName}
                  fileSizeBytes={message.fileSizeBytes}
                  fileContentType={message.fileContentType}
                />
              </div>
            )}
            {message.content && <p>{message.content}</p>}
          </>
        )

        function handleContextMenu(event: React.MouseEvent) {
          if (!isOwn || message.isDeleted) return
          event.preventDefault()
          setMenu({ x: event.clientX, y: event.clientY, message })
        }

        if (isOwn) {
          const requiredReaderIds = members.filter((m) => m.userId !== message.senderId).map((m) => m.userId)
          const readers = readBy.get(message.id) ?? new Set<string>()
          const allRead = requiredReaderIds.length > 0 && requiredReaderIds.every((id) => readers.has(id))

          return (
            <div
              key={message.id}
              onContextMenu={handleContextMenu}
              className={`flex justify-end ${isGrouped ? 'mt-0.5' : 'mt-3'}`}
            >
              <div className="max-w-md rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-white">
                {bodyContent}
                {!isEditing && (
                  <div className="mt-1 flex items-center justify-between gap-3">
                    {message.isDeleted ? (
                      <span />
                    ) : (
                      <ReadReceiptTick read={allRead} />
                    )}
                    <span className="font-mono text-[10px] text-white/70">
                      {message.editedAt && !message.isDeleted && 'edited · '}
                      {showTime && formatTime(message.sentAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        }

        return (
          <div key={message.id} className={`flex gap-3 ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
            <div className="w-8 shrink-0">
              {!isGrouped && <Avatar name={message.senderDisplayName} size="sm" />}
            </div>
            <div className="max-w-md border-l-2 border-line pl-3">
              {!isGrouped && <p className="text-sm font-medium text-ink">{message.senderDisplayName}</p>}
              {bodyContent}
              {showTime && (
                <div className="mt-1 flex justify-end">
                  <span className="font-mono text-[10px] text-ink-soft">
                    {message.editedAt && !message.isDeleted && 'edited · '}
                    {formatTime(message.sentAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: 'Edit', onClick: () => startEdit(menu.message) },
            { label: 'Delete', danger: true, onClick: () => setDeleteTarget(menu.message) },
          ]}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete message?"
          message="This can't be undone. Anyone in this conversation will see that the message was deleted."
          confirmLabel="Delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDelete(deleteTarget.id)
            setDeleteTarget(null)
          }}
        />
      )}
    </div>
  )
}