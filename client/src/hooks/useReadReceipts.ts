import { useEffect, useRef, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'
import type { Message, ReadReceipt } from '@/types/chat'

export function useReadReceipts(
  connection: HubConnection | null,
  groupId: number,
  messages: Message[] | undefined,
  currentUserId: string | undefined
) {
  const [readBy, setReadBy] = useState<Map<number, Set<string>>>(new Map())
  const lastMarkedIdRef = useRef<number | null>(null)
  const hydratedGroupIdRef = useRef<number | null>(null)

  // Reset state the moment we switch groups
  useEffect(() => {
    if (hydratedGroupIdRef.current !== groupId) {
      setReadBy(new Map())
      lastMarkedIdRef.current = null
    }
  }, [groupId])

  // Hydrate once per group, from whatever history has already loaded
  useEffect(() => {
    if (!messages || messages.length === 0) return
    if (hydratedGroupIdRef.current === groupId) return

    const map = new Map<number, Set<string>>()
    for (const message of messages) {
      if (message.readByUserIds.length > 0) {
        map.set(message.id, new Set(message.readByUserIds))
      }
    }
    setReadBy(map)
    hydratedGroupIdRef.current = groupId
  }, [messages, groupId])

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
    if (latest.senderId === currentUserId) return
    if (lastMarkedIdRef.current === latest.id) return

    lastMarkedIdRef.current = latest.id
    connection.invoke('MarkAsRead', latest.id).catch(() => {})
  }, [connection, groupId, messages, currentUserId])

  return readBy
}