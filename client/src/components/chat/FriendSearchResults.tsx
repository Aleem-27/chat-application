import { useMemo } from 'react'
import { useFriends } from '@/hooks/useFriends'
import { useCreateDirectMessage } from '@/hooks/useGroups'
import { useFriendContextMenu } from '@/hooks/useFriendContextMenu'
import { Avatar } from '@/components/shared/Avatar'
import { ContextMenu } from '@/components/shared/ContextMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

interface FriendSearchResultsProps {
  query: string
  onOpenConversation: (groupId: number) => void
}

export function FriendSearchResults({ query, onOpenConversation }: FriendSearchResultsProps) {
  const { data: friends } = useFriends()
  const createDm = useCreateDirectMessage()
  const { menu, menuItems, confirmTarget, openMenu, closeMenu, confirmRemove, cancelRemove } = useFriendContextMenu()

  const filtered = useMemo(() => {
    if (!friends) return []
    const normalized = query.trim().toLowerCase()
    return friends.filter((f) => f.displayName.toLowerCase().includes(normalized))
  }, [friends, query])

  function handleClick(friend: (typeof filtered)[number]) {
    createDm.mutate(friend.userId, { onSuccess: (group) => onOpenConversation(group.id) })
  }

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
      {filtered.length === 0 && <p className="px-3 py-2 text-sm text-white/50">No matches.</p>}

      {filtered.map((friend) => (
        <button
          key={friend.id}
          onClick={() => handleClick(friend)}
          onContextMenu={(e) =>
            openMenu(e, {
              userId: friend.userId,
              displayName: friend.displayName,
              status: 'friend',
              friendshipId: friend.id,
            })
          }
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10"
        >
          <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{friend.displayName}</p>
            <p className="truncate text-xs text-white/50">{friend.email}</p>
          </div>
        </button>
      ))}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={menuItems}
        />
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Remove friend?"
          message={`${confirmTarget.displayName} will be removed from your friends. You can send a new request later if you change your mind.`}
          confirmLabel="Remove"
          onCancel={cancelRemove}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  )
}