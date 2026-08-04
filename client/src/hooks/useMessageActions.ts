import { useCallback } from 'react'
import type { HubConnection } from '@microsoft/signalr'

export function useMessageActions(connection: HubConnection | null) {
  const editMessage = useCallback(
    (messageId: number, content: string) => {
      if (!connection) return
      connection.invoke('EditMessage', { messageId, content }).catch((err: unknown) => {
        console.error('Failed to edit message:', err)
      })
    },
    [connection]
  )

  const deleteMessage = useCallback(
    (messageId: number) => {
      if (!connection) return
      connection.invoke('DeleteMessage', messageId).catch((err: unknown) => {
        console.error('Failed to delete message:', err)
      })
    },
    [connection]
  )

  return { editMessage, deleteMessage }
}