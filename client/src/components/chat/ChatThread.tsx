import { useEffect, useState } from 'react'
import { useCurrentUser } from '@/hooks/useAuth'
import { useMessages } from '@/hooks/useMessages'
import { useChatConnectionContext } from '@/lib/chatConnectionContext'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { useReadReceipts } from '@/hooks/useReadReceipts'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { TypingIndicator } from './TypingIndicator'
import type { Group } from '@/types/chat'
import type { FileUploadResponse } from '@/types/files'
import { ChevronLeft } from 'lucide-react'
import { useSendFriendRequestByUserId } from '@/hooks/useFriends'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { MessageBlocked } from '@/types/chat'
interface ChatThreadProps {
group: Group
onBack: () => void
}

export function ChatThread({ group, onBack }: ChatThreadProps) {
  const { data: user } = useCurrentUser()
  const { data: messages, isLoading } = useMessages(group.id)
  const { connection } = useChatConnectionContext()
  const { typingUserIds, notifyTyping } = useTypingIndicator(connection, group.id)
  const [blockedInfo, setBlockedInfo] = useState<MessageBlocked | null>(null)
  const sendFriendRequest = useSendFriendRequestByUserId()  
  useReadReceipts(connection, group.id, messages, user?.id)

  useEffect(() => {
    if (!connection) return
    
    connection.invoke('JoinGroup', group.id).catch((err: unknown) => {
      console.error('Failed to join group:', err)
    })

    function handleBlocked(payload: MessageBlocked) {
      if (payload.groupId !== group.id) return
      setBlockedInfo(payload)
    }

    connection.on('MessageBlocked', handleBlocked)

    return () => {
      connection.off('MessageBlocked', handleBlocked)
    }
  }, [connection, group.id])

  function handleSend(content: string) {
    if (!connection) return
    connection.invoke('SendMessage', { groupId: group.id, content }).catch((err: unknown) => {
      console.error('Failed to send message:', err)
    })
  }

  function handleSendFile(file: FileUploadResponse) {
    if (!connection) return
    connection
      .invoke('SendMessage', {
        groupId: group.id,
        fileUrl: file.fileUrl,
        fileName: file.fileName,
        fileSizeBytes: file.fileSizeBytes,
        fileContentType: file.fileContentType,
      })
      .catch((err: unknown) => {
        console.error('Failed to send file message:', err)
      })
  }

  const otherMember = group.isDirectMessage
    ? group.members.find((m) => m.userId !== user?.id)
    : undefined
  const title = group.isDirectMessage ? (otherMember?.displayName ?? group.name) : group.name
  const readBy = useReadReceipts(connection, group.id, messages, user?.id)

  return (
    <div className="flex h-full flex-1 flex-col">
      <header className="flex items-center gap-2 border-b border-line bg-surface px-4 py-4 md:px-6">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-accent-tint hover:text-accent md:hidden"
          aria-label="Back to conversations"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="font-display text-lg text-ink">{title}</h2>
      </header>

      {isLoading || !user ? (
        <div className="flex flex-1 items-center justify-center text-ink-soft">Loading messages…</div>
      ) : (
        <MessageList messages={messages   ?? []} currentUserId={user.id} members={group.members} readBy={readBy}/>
      )}

      <TypingIndicator typingUserIds={typingUserIds} members={group.members} />
      <MessageInput onSend={handleSend} onSendFile={handleSendFile} onTyping={notifyTyping} disabled={!connection} />
      {blockedInfo && (
        <ConfirmDialog title="You're not friends yet"
          message={`You can't message ${blockedInfo.targetDisplayName} until you're friends.`}
          confirmLabel="Add Friend"
          cancelLabel="OK"
          variant="primary"
          onCancel={() => setBlockedInfo(null)}
          onConfirm={() => {
            sendFriendRequest.mutate(blockedInfo.targetUserId)
            setBlockedInfo(null)
          }}
        />
      )}
    </div>
  )
}