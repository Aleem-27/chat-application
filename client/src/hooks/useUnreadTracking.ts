import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import { useUnreadStore } from '@/store/unreadStore'
import { playNotificationSound } from '@/lib/sound'
import { toLastMessagePreview } from '@/lib/chat'
import type { Group, Message } from '@/types/chat'

export function useUnreadTracking(
  connection: HubConnection | null,
  currentUserId: string | undefined,
  selectedGroupId: number | null
) {
  const queryClient = useQueryClient()
  const increment = useUnreadStore((s) => s.increment)

  useEffect(() => {
    if (!connection || !currentUserId) return

    function handleReceiveMessage(message: Message) {
      const cached = queryClient.getQueryData<Group[]>(['groups'])
      const exists = cached?.some((g) => g.id === message.groupId)

      if (!exists) {
        queryClient.invalidateQueries({ queryKey: ['groups'] })
      } else {
        queryClient.setQueryData<Group[]>(['groups'], (groups) =>
          groups?.map((g) =>
            g.id === message.groupId
              ? { ...g, lastMessageAt: message.sentAt, lastMessage: toLastMessagePreview(message) }
              : g
          )
        )
      }

      if (message.senderId === currentUserId) return
      if (message.groupId === selectedGroupId) return

      increment(message.groupId)
      playNotificationSound()
    }

    connection.on('ReceiveMessage', handleReceiveMessage)
    return () => connection.off('ReceiveMessage', handleReceiveMessage)
  }, [connection, currentUserId, selectedGroupId, queryClient, increment])
}