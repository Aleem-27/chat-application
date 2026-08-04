import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import type { Message } from '@/types/chat'

export function useMessageStream(connection: HubConnection | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!connection) return

    function upsert(message: Message) {
      queryClient.setQueryData<Message[]>(['messages', message.groupId], (existing) => {
        if (!existing) return [message]
        const index = existing.findIndex((m) => m.id === message.id)
        if (index === -1) return [...existing, message]
        const next = [...existing]
        next[index] = message
        return next
      })
    }

    connection.on('ReceiveMessage', upsert)
    connection.on('MessageEdited', upsert)
    connection.on('MessageDeleted', upsert)

    return () => {
      connection.off('ReceiveMessage', upsert)
      connection.off('MessageEdited', upsert)
      connection.off('MessageDeleted', upsert)
    }
  }, [connection, queryClient])
}