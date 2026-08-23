import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { HubConnection } from '@microsoft/signalr'

export function useFriendRealtimeSync(connection: HubConnection | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!connection) return

    function refresh() {
      // Prefix match — invalidates both ['friends'] and ['friends', 'requests']
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    }

    connection.on('FriendRequestReceived', refresh)
    connection.on('FriendRequestAccepted', refresh)
    connection.on('FriendRequestDeclined', refresh)
    connection.on('FriendRemoved', refresh)
    connection.on('FriendRequestCancelled', refresh)

    return () => {
      connection.off('FriendRequestReceived', refresh)
      connection.off('FriendRequestAccepted', refresh)
      connection.off('FriendRequestDeclined', refresh)
      connection.off('FriendRemoved', refresh)
      connection.off('FriendRequestCancelled', refresh)
    }
  }, [connection, queryClient])
}