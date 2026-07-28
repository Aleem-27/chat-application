import { useCallback, useEffect, useRef, useState } from 'react'
import type { HubConnection } from '@microsoft/signalr'

const TYPING_DEBOUNCE_MS = 2000

export function useTypingIndicator(connection: HubConnection | null, groupId: number) {
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set())
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!connection) return

    function handleTyping(eventGroupId: number, userId: string) {
      if (eventGroupId !== groupId) return
      setTypingUserIds((prev) => new Set(prev).add(userId))
    }

    function handleStoppedTyping(eventGroupId: number, userId: string) {
      if (eventGroupId !== groupId) return
      setTypingUserIds((prev) => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }

    connection.on('UserTyping', handleTyping)
    connection.on('UserStoppedTyping', handleStoppedTyping)

    return () => {
      connection.off('UserTyping', handleTyping)
      connection.off('UserStoppedTyping', handleStoppedTyping)
      setTypingUserIds(new Set()) // clear stale state when switching groups
    }
  }, [connection, groupId])

  const notifyTyping = useCallback(() => {
    if (!connection) return

    connection.invoke('Typing', groupId).catch(() => {})

    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current)
    stopTimeoutRef.current = setTimeout(() => {
      connection.invoke('StopTyping', groupId).catch(() => {})
    }, TYPING_DEBOUNCE_MS)
  }, [connection, groupId])

  return { typingUserIds, notifyTyping }
}