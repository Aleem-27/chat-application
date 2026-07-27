import { useEffect, useRef, useState } from 'react'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { createHubConnection } from '@/lib/signalr'
import { usePresenceStore } from '@/store/presenceStore'
import { useCurrentUser } from './useAuth'

export function useChatConnection() {
  const { data: user } = useCurrentUser()
  const connectionRef = useRef<HubConnection | null>(null)
  const [state, setState] = useState<HubConnectionState>(HubConnectionState.Disconnected)
  const setOnline = usePresenceStore((s) => s.setOnline)
  const setOffline = usePresenceStore((s) => s.setOffline)

  useEffect(() => {
    if (!user) return

    const connection = createHubConnection()
    connectionRef.current = connection

    connection.on('UserOnline', (userId: string) => setOnline(userId))
    connection.on('UserOffline', (userId: string) => setOffline(userId))

    connection.onreconnecting(() => setState(HubConnectionState.Reconnecting))
    connection.onreconnected(() => setState(HubConnectionState.Connected))
    connection.onclose(() => setState(HubConnectionState.Disconnected))

    connection
      .start()
      .then(() => setState(HubConnectionState.Connected))
      .catch((err: unknown) => {
        console.error('SignalR connection failed:', err)
        setState(HubConnectionState.Disconnected)
      })

    return () => {
      void connection.stop()
      connectionRef.current = null
    }
  }, [user, setOnline, setOffline])

  return { connection: connectionRef.current, state }
}