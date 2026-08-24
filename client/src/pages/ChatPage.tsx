import { useState } from 'react'
import { ChatConnectionProvider, useChatConnectionContext } from '@/lib/chatConnectionContext'
import { useGroups } from '@/hooks/useGroups'
import { useMessageStream } from '@/hooks/useMessageStream'
import { Sidebar } from '@/components/chat/Sidebar'
import { ChatThread } from '@/components/chat/ChatThread'
import { useFriendRealtimeSync } from '@/hooks/useFriendRealTimeSync'
import { useGroupRealtimeSync } from '@/hooks/useGroupRealtimeSync'
import { useUnreadTracking } from '@/hooks/useUnreadTracking'
import { useUnreadStore } from '@/store/unreadStore'
import { useCurrentUser } from '@/hooks/useAuth'

function ChatPageContent() {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const { data: user } = useCurrentUser()
  const { data: groups } = useGroups()
  const { connection } = useChatConnectionContext()
  const clearUnread = useUnreadStore((s) => s.clear)

  useMessageStream(connection)
  useFriendRealtimeSync(connection)
  useGroupRealtimeSync(connection)
  useUnreadTracking(connection, user?.id, selectedGroupId)

  function handleSelectGroup(groupId: number) {
    setSelectedGroupId(groupId)
    clearUnread(groupId)
  }

  function handleGroupClosed(groupId: number) {
  setSelectedGroupId((current) => (current === groupId ? null : current))
}

  const selectedGroup = groups?.find((g) => g.id === selectedGroupId)

  return (
    <div className="flex h-screen bg-canvas">
      <Sidebar selectedGroupId={selectedGroupId} onSelectGroup={handleSelectGroup} onGroupClosed={handleGroupClosed} />
      <main className="flex flex-1">
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