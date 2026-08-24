import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'
import type { Group } from '@/types/chat'

export function useGroupRealtimeSync(connection: HubConnection | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!connection) return

    function upsertGroup(group: Group) {
      queryClient.setQueryData<Group[]>(['groups'], (groups) => {
        if (!groups) return [group]
        const exists = groups.some((g) => g.id === group.id)
        return exists ? groups.map((g) => (g.id === group.id ? group : g)) : [...groups, group]
      })
    }

    connection.on('GroupCreated', upsertGroup)
    connection.on('GroupUpdated', upsertGroup)

    return () => {
      connection.off('GroupCreated', upsertGroup)
      connection.off('GroupUpdated', upsertGroup)
    }
  }, [connection, queryClient])
}