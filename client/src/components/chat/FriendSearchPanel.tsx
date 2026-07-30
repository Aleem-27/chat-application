import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useFriends, useRemoveFriend } from '@/hooks/useFriends'
import { useCreateDirectMessage } from '@/hooks/useGroups'
import { Avatar } from '@/components/shared/Avatar'
import { ContextMenu } from '@/components/shared/ContextMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { Friendship } from '@/types/friends'

interface FriendSearchPanelProps {
  onClose: () => void
  onOpenConversation: (groupId: number) => void
}

interface MenuState {
  x: number
  y: number
  friend: Friendship
}

export function FriendSearchPanel({ onClose, onOpenConversation }: FriendSearchPanelProps) {
  const [query, setQuery] = useState('')
  const { data: friends } = useFriends()
  const createDm = useCreateDirectMessage()
  const removeFriend = useRemoveFriend()

  const [menu, setMenu] = useState<MenuState | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Friendship | null>(null)

  const filtered = useMemo(() => {
    if (!friends) return []
    const normalized = query.trim().toLowerCase()
    if (!normalized) return friends
    return friends.filter((f) => f.displayName.toLowerCase().includes(normalized))
  }, [friends, query])

  function handleFriendClick(friend: Friendship) {
    createDm.mutate(friend.userId, {
      onSuccess: (group) => {
        onOpenConversation(group.id)
        onClose()
      },
    })
  }

  function handleContextMenu(event: React.MouseEvent, friend: Friendship) {
    event.preventDefault()
    setMenu({ x: event.clientX, y: event.clientY, friend })
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2">
        <Search size={16} className="text-white/50" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search friends by name…"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
        />
      </div>

      <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-1 py-2 text-sm text-white/50">
            {friends?.length === 0 ? 'No friends yet.' : 'No matches.'}
          </p>
        )}

        {filtered.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleFriendClick(friend)}
            onContextMenu={(e) => handleContextMenu(e, friend)}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10"
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