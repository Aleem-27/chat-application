import { useEffect, useRef } from 'react'
import { Avatar } from '@/components/shared/Avatar'
import type { Message } from '@/types/chat'

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

const GROUP_GAP_MINUTES = 5

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageList({ messages, currentUserId }: MessageListProps) {
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

        const showTime = !previous || formatTime(message.sentAt) !== formatTime(previous.sentAt)

        if (isOwn) {
          return (
            <div key={message.id} className={`flex justify-end ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
              <div className="max-w-md">
                <div className="rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-white">
                  {message.content}
                </div>
                {showTime && (
                  <p className="mt-1 text-right font-mono text-[11px] text-ink-soft">
                    {formatTime(message.sentAt)}
                  </p>
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
            <div className="flex max-w-md flex-col border-l-2 border-line pl-3">
              {!isGrouped && <p className="text-sm font-medium text-ink">{message.senderDisplayName}</p>}
              <p className="text-ink">{message.content}</p>
              {showTime && (
                <p className="mt-1 font-mono text-[11px] text-ink-soft">{formatTime(message.sentAt)}</p>
              )}
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}