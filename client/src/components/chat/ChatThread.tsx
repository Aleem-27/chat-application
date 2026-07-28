  import { useEffect } from 'react'
  import { useCurrentUser } from '@/hooks/useAuth'
  import { useMessages } from '@/hooks/useMessages'
  import { useChatConnectionContext } from '@/lib/chatConnectionContext'
  import { useTypingIndicator } from '@/hooks/useTypingIndicator'
  import { useReadReceipts } from '@/hooks/useReadReceipts'
  import { MessageList } from './MessageList'
  import { MessageInput } from './MessageInput'
  import { TypingIndicator } from './TypingIndicator'
  import type { Group } from '@/types/chat'

  export function ChatThread({ group }: { group: Group }) {
    const { data: user } = useCurrentUser()
    const { data: messages, isLoading } = useMessages(group.id)
    const { connection } = useChatConnectionContext()
    const { typingUserIds, notifyTyping } = useTypingIndicator(connection, group.id)
    useReadReceipts(connection, group.id, messages, user?.id)

    useEffect(() => {
      if (!connection) return
      connection.invoke('JoinGroup', group.id).catch((err: unknown) => {
        console.error('Failed to join group:', err)
      })
    }, [connection, group.id])

    function handleSend(content: string) {
      if (!connection) return
      connection.invoke('SendMessage', { groupId: group.id, content }).catch((err: unknown) => {
        console.error('Failed to send message:', err)
      })
    }

    const otherMember = group.isDirectMessage
      ? group.members.find((m) => m.userId !== user?.id)
      : undefined
    const title = group.isDirectMessage ? (otherMember?.displayName ?? group.name) : group.name

    return (
      <div className="flex h-full flex-1 flex-col">
        <header className="border-b border-line bg-surface px-6 py-4">
          <h2 className="font-display text-lg text-ink">{title}</h2>
        </header>

        {isLoading || !user ? (
          <div className="flex flex-1 items-center justify-center text-ink-soft">Loading messages…</div>
        ) : (
          <MessageList messages={messages ?? []} currentUserId={user.id} />
        )}

        <TypingIndicator typingUserIds={typingUserIds} members={group.members} />
        <MessageInput onSend={handleSend} disabled={!connection} onTyping={notifyTyping} />
      </div>
    )
  }