import { createContext, useContext, type ReactNode } from 'react'
import { HubConnectionState, type HubConnection } from '@microsoft/signalr'
import { useChatConnection } from '@/hooks/useChatConnection'

interface ChatConnectionValue {
  connection: HubConnection | null
  state: HubConnectionState
}

const ChatConnectionContext = createContext<ChatConnectionValue | null>(null)

export function ChatConnectionProvider({ children }: { children: ReactNode }) {
  const value = useChatConnection()
  return (
    <ChatConnectionContext.Provider value={value}>{children}</ChatConnectionContext.Provider>
  )
}

export function useChatConnectionContext() {
  const context = useContext(ChatConnectionContext)
  if (!context) {
    throw new Error('useChatConnectionContext must be used within ChatConnectionProvider')
  }
  return context
}