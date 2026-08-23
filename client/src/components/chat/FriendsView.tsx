import { useState, type FormEvent, type MouseEvent } from 'react'
import { X } from 'lucide-react'
import { useFriends, usePendingRequests, useRemoveFriend, useRespondToRequest, useSendFriendRequest } from '@/hooks/useFriends'
import { useCreateDirectMessage } from '@/hooks/useGroups'
import { Avatar } from '@/components/shared/Avatar'
import { ContextMenu } from '@/components/shared/ContextMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { getErrorMessage } from '@/lib/errors'
import type { Friendship } from '@/types/friends'

interface FriendsViewProps {
  onClose: () => void
  onOpenConversation: (groupId: number) => void
}

interface MenuState {
  x: number
  y: number
  friend: Friendship
}

export function FriendsView({ onClose, onOpenConversation }: FriendsViewProps) {
  const [email, setEmail] = useState('')
  const sendRequest = useSendFriendRequest()
  const { data: pendingRequests } = usePendingRequests()
  const respond = useRespondToRequest()
  const { data: friends } = useFriends()
  const createDm = useCreateDirectMessage()
  const removeFriend = useRemoveFriend()

  const [menu, setMenu] = useState<MenuState | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Friendship | null>(null)

  const incoming = pendingRequests?.filter((r) => r.isIncoming) ?? []

  function handleAddSubmit(event: FormEvent) {
    event.preventDefault()
    sendRequest.mutate(email, { onSuccess: () => setEmail('') })
  }

  function handleOpenChat(friend: Friendship) {
    createDm.mutate(friend.userId, { onSuccess: (group) => onOpenConversation(group.id) })
  }

  function handleContextMenu(event: MouseEvent, friend: Friendship) {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, friend })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <p className="text-sm font-semibold text-white/80">Friends</p>
        <button onClick={onClose} aria-label="Back to conversations" className="text-white/60 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleAddSubmit} className="flex gap-2 px-4 pb-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Add by email"
          className="min-w-0 flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={sendRequest.isPending}
          className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {sendRequest.isError && (
        <p className="px-4 pb-2 text-xs text-danger">{getErrorMessage(sendRequest.error)}</p>
      )}

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {incoming.length > 0 && (
          <div className="mb-4">
            <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-white/40">Pending</p>
            {incoming.map((request) => (
              <div key={request.id} className="flex items-center gap-2 rounded-md px-2 py-2">
                <Avatar name={request.displayName} avatarUrl={request.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{request.displayName}</p>
                  <p className="truncate text-xs text-white/50">{request.email}</p>
                </div>
                <button
                  onClick={() => respond.mutate({ id: request.id, accept: true })}
                  className="text-xs font-medium text-signal"
                >
                  Accept
                </button>
                <button
                  onClick={() => respond.mutate({ id: request.id, accept: false })}
                  className="text-xs font-medium text-white/50"
                >
                  Reject
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-white/40">Friends</p>
        {friends?.length === 0 && <p className="px-2 py-2 text-sm text-white/50">No friends yet.</p>}
        {friends?.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleOpenChat(friend)}
            onContextMenu={(e) => handleContextMenu(e, friend)}
            className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10"
          >
            <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{friend.displayName}</p>
              <p className="truncate text-xs text-white/50">{friend.email}</p>
            </div>
          </button>
        ))}
      </div>

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          items={[
            { label: 'Open chat', onClick: () => handleOpenChat(menu.friend) },
            {
              label: 'Remove friend',
              danger: true,
              onClick: () => setConfirmTarget(menu.friend),
            },
          ]}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Remove friend?"
          message={`${confirmTarget.displayName} will be removed from your friends. You can send a new request later if you change your mind.`}
          confirmLabel="Remove"
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => {
            removeFriend.mutate(confirmTarget.id)
            setConfirmTarget(null)
          }}
        />
      )}
    </div>
  )
}