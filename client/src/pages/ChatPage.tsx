import { useState } from 'react'
import { ChatConnectionProvider, useChatConnectionContext } from '@/lib/chatConnectionContext'
import { useGroups } from '@/hooks/useGroups'
import { useMessageStream } from '@/hooks/useMessageStream'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatThread } from '@/components/chat/ChatThread'

function ChatPageContent() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const { data: groups } = useGroups()
  const { connection } = useChatConnectionContext()

  useMessageStream(connection)

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <div className={`${selectedGroupId ? 'hidden' : 'flex'} w-full md:flex md:w-72`}>
        <Sidebar selectedGroupId={selectedGroupId} onSelectGroup={setSelectedGroupId} />
      </div>

      <main className={`${selectedGroupId ? 'flex' : 'hidden'} flex-1 md:flex`}>
        {selectedGroup ? (
          <ChatThread group={selectedGroup} onBack={() => setSelectedGroupId(null)} />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="font-display text-2xl text-ink-soft">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function ChatPage() {
  return (
    <ChatConnectionProvider>
      <ChatPageContent />
    </ChatConnectionProvider>
  )
}