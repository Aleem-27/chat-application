import { useState } from 'react'
import { Search, UserPlus, X } from 'lucide-react'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useGroups } from '@/hooks/useGroups'
import { useFriends } from '@/hooks/useFriends'
import { usePresenceSync } from '@/hooks/usePresenceSync'
import { usePresenceStore } from '@/store/presenceStore'
import { useThemeStore } from '@/store/themeStore'
import { useFriendContextMenu } from '@/hooks/useFriendContextMenu'
import { Avatar } from '@/components/shared/Avatar'
import { OnlineDot } from '@/components/shared/OnlineDot'
import { ContextMenu } from '@/components/shared/ContextMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AddFriendPanel } from './AddFriendPanel'
import { FriendSearchResults } from './FriendSearchResults'
import { Moon, Sun } from 'lucide-react'
import type { Group } from '@/types/chat'

interface SidebarProps {
  selectedGroupId: number | null
  onSelectGroup: (groupId: number) => void
}

function otherMember(group: Group, currentUserId: string) {
  return group.members.find((m) => m.userId !== currentUserId)
}

export function Sidebar({ selectedGroupId, onSelectGroup }: SidebarProps) {
  const { data: user } = useCurrentUser()
  const { data: groups, isLoading } = useGroups()
  const { data: friends } = useFriends()
  const logout = useLogout()
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds)
  const { theme, toggleTheme } = useThemeStore()
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { menu, confirmTarget, openMenu, closeMenu, requestRemove, confirmRemove, cancelRemove, addFriend } =
    useFriendContextMenu()

  usePresenceSync(groups)

  const isSearching = searchQuery.trim().length > 0

  return (
    <aside className="flex h-full w-full flex-col border-r border-line bg-panel text-white md:w-72">
      <div className="flex items-center justify-between px-5 pt-5">
        <h1 className="font-display text-2xl">Converseo</h1>
        <button
          onClick={() => setAddFriendOpen((open) => !open)}
          aria-label="Add a friend"
          className="text-white/60 hover:text-white"
        >
          <UserPlus size={18} />
        </button>
      </div>

      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2">
          <Search size={16} className="text-white/50" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends…"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40"
          />
          {isSearching && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="text-white/50 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {addFriendOpen && <AddFriendPanel onClose={() => setAddFriendOpen(false)} />}

      {isSearching ? (
        <FriendSearchResults query={searchQuery} onOpenConversation={onSelectGroup} />
      ) : (
        <nav className="flex-1 overflow-y-auto px-2">
          {isLoading && <p className="px-3 py-2 text-sm text-white/50">Loading conversations…</p>}
          {groups?.length === 0 && (
            <p className="px-3 py-2 text-sm text-white/50">No conversations yet.</p>
          )}

          {groups?.map((group) => {
            const other = user ? otherMember(group, user.id) : undefined
            const displayName = group.isDirectMessage ? (other?.displayName ?? group.name) : group.name
            const isOnline = group.isDirectMessage && !!other && onlineUserIds.has(other.userId)
            // const isFriend = other ? friends?.some((f) => f.userId === other.userId) : undefined

            return (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                onContextMenu={(e) => {
                  if (!group.isDirectMessage || !other) return
                  const existingFriendship = friends?.find((f) => f.userId === other.userId)
                  openMenu(e, {
                    friendshipId: existingFriendship?.id ?? null,
                    userId: other.userId,
                    displayName: other.displayName,
                  })
                }}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10 ${
                  group.id === selectedGroupId ? 'bg-white/10' : ''
                }`}
              >
                <span className="relative">
                  <Avatar name={displayName} size="sm" />
                  <OnlineDot online={isOnline} />
                </span>
                <span className="truncate text-sm font-medium">{displayName}</span>
              </button>
            )
          })}
        </nav>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={[
            menu.friendshipId
              ? { label: 'Remove friend', danger: true, onClick: requestRemove }
              : { label: 'Add friend', onClick: addFriend },
          ]}
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

      {user && (
        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
          <Avatar name={user.displayName} avatarUrl={user.avatarUrl} size="sm" />
          <p className="flex-1 truncate text-sm font-medium">{user.displayName}</p>
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={() => logout.mutate()}
            className="text-xs font-medium text-white/60 hover:text-white"
          >
            Log out
          </button>
        </div>
      )}
    </aside>
  )
}