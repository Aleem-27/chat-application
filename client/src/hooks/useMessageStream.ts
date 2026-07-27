import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import type { Message } from '@/types/chat'

export function useMessageStream(connection: HubConnection | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!connection) return

    function handleReceiveMessage(message: Message) {
      queryClient.setQueryData<Message[]>(['messages', message.groupId], (existing) => {
        if (!existing) return [message]
        if (existing.some((m) => m.id === message.id)) return existing // guard against duplicate delivery
        return [...existing, message]
      })
    }

    connection.on('ReceiveMessage', handleReceiveMessage)
    return () => {
      connection.off('ReceiveMessage', handleReceiveMessage)
    }
  }, [connection, queryClient])
}