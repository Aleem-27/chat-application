import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import type { Message } from '@/types/chat'

export function useMessageStream(connection: HubConnection | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!connection) return

    function upsert(message: Message) {
      queryClient.setQueryData<InfiniteData<Message[]>>(['messages', message.groupId], (old) => {
        if (!old) {
          return { pages: [[message]], pageParams: [1] }
        }

        let found = false
        const pages = old.pages.map((page) => {
          const index = page.findIndex((m) => m.id === message.id)
          if (index === -1) return page
          found = true
          const next = [...page]
          next[index] = message
          return next
        })

        if (found) {
          return { ...old, pages }
        }

        // New message — belongs on the most recent page (index 0)
        const newPages = [...pages]
        newPages[0] = [...(newPages[0] ?? []), message]
        return { ...old, pages: newPages }
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