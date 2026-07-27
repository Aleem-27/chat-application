import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'

export function createHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${import.meta.env.VITE_API_URL}/hubs/chat`, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()
}