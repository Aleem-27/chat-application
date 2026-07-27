import { ChatConnectionProvider } from '@/lib/chatConnectionContext'
import { Sidebar } from '@/components/chat/Sidebar'

export default function ChatPage() {
  return (
    <ChatConnectionProvider>
      <div className="flex h-screen bg-canvas">
        <Sidebar />
        <main className="flex flex-1 items-center justify-center">
          <p className="font-display text-2xl text-ink-soft">
            Select a conversation to start chatting
          </p>
        </main>
      </div>
    </ChatConnectionProvider>
  )
}