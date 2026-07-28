import { useEffect, useRef, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import type { Message, ReadReceipt } from '@/types/chat'

export function useReadReceipts(
  connection: HubConnection | null,
  groupId: number,
  messages: Message[] | undefined,
  currentUserId: string | undefined
) {
  // messageId -> array of userIds who've read it
  const [readBy, setReadBy] = useState<Map<number, Set<string>>>(new Map())
  const lastMarkedIdRef = useRef<number | null>(null)

  useEffect(() => {
    if (!connection) return

    function handleMessageRead(receipt: ReadReceipt) {
      setReadBy((prev) => {
        const next = new Map(prev)
        const readers = new Set(next.get(receipt.messageId))
        readers.add(receipt.userId)
        next.set(receipt.messageId, readers)
        return next
      })
    }

    connection.on('MessageRead', handleMessageRead)
    return () => connection.off('MessageRead', handleMessageRead)
  }, [connection])

  useEffect(() => {
    if (!connection || !messages || messages.length === 0 || !currentUserId) return

    const latest = messages[messages.length - 1]
    if (latest.senderId === currentUserId) return // don't mark your own message as read
    if (lastMarkedIdRef.current === latest.id) return

    lastMarkedIdRef.current = latest.id
    connection.invoke('MarkAsRead', latest.id).catch(() => {})
  }, [connection, groupId, messages, currentUserId])

  return readBy
}