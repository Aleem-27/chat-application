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

    function handleAdminChanged(group: Group) {
      upsertGroup(group)
      // Force a real refetch too — role changes affect what the context menu
      // is allowed to show, so this can't be left to a best-effort cache merge.
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    }

    connection.on('GroupCreated', upsertGroup)
    connection.on('GroupUpdated', upsertGroup)
    connection.on('GroupAdminChanged', handleAdminChanged)

    return () => {
      connection.off('GroupCreated', upsertGroup)
      connection.off('GroupUpdated', upsertGroup)
      connection.off('GroupAdminChanged', handleAdminChanged)
    }
  }, [connection, queryClient])
}