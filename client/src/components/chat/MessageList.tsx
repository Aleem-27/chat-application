import { useEffect, useRef } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import { ReadReceiptTick } from './ReadReceiptTick'
import type { GroupMember, Message } from '@/types/chat'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  members: GroupMember[]
  readBy: Map<number, Set<string>>
}

const GROUP_GAP_MINUTES = 5

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageList({ messages, currentUserId, members, readBy }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 py-4">
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId
        const previous = messages[index - 1]

        const isGrouped =
          !!previous &&
          previous.senderId === message.senderId &&
          (new Date(message.sentAt).getTime() - new Date(previous.sentAt).getTime()) / 60000 
            GROUP_GAP_MINUTES

        const showTime = !previous || previous.senderId !== message.senderId || formatTime(message.sentAt) !== formatTime(previous.sentAt)

        if (isOwn) {
          const requiredReaderIds = members
            .filter((m) => m.userId !== message.senderId)
            .map((m) => m.userId)
          const readers = readBy.get(message.id) ?? new Set<string>()
          const allRead =
            requiredReaderIds.length > 0 && requiredReaderIds.every((id) => readers.has(id))

          return (
            <div key={message.id} className={`flex justify-end ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
              <div className="max-w-md rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-white">
                <p>{message.content}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <ReadReceiptTick read={allRead} />
                  {showTime && (
                    <span className="font-mono text-[10px] text-white/70">
                      {formatTime(message.sentAt)}
                    </span>
                  )}
                </div>
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
              <p className="text-ink">{message.content}</p>
              {showTime && (
                <div className="mt-1 flex justify-end">
                  <span className="font-mono text-[10px] text-ink-soft">
                    {formatTime(message.sentAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}