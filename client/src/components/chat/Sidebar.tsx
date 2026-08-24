import { useState } from 'react'
import { Plus, Search, Users as UsersIcon, X } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useAuth'
import { useGroups, useHideGroup } from '@/hooks/useGroups'
import { useFriends, usePendingRequests } from '@/hooks/useFriends'
import { usePresenceSync } from '@/hooks/usePresenceSync'
import { usePresenceStore } from '@/store/presenceStore'
import { useUnreadStore } from '@/store/unreadStore'
import { useFriendContextMenu } from '@/hooks/useFriendContextMenu'
import { getRelationshipStatus } from '@/lib/friends'
import { formatConversationPreview } from '@/lib/chat'
import { Avatar } from '@/components/shared/Avatar'
import { OnlineDot } from '@/components/shared/OnlineDot'
import { ContextMenu } from '@/components/shared/ContextMenu'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { FriendSearchResults } from './FriendSearchResults'
import { FriendsView } from './FriendsView'
import { ProfilePanel } from './ProfilePanel'
import type { Group } from '@/types/chat'
import { useLeaveGroup } from '@/hooks/useGroups'
import { GroupModal } from './GroupModal'

interface SidebarProps {
  selectedGroupId: number | null
  onSelectGroup: (groupId: number) => void
  onGroupClosed: (groupId: number) => void
}

function otherMember(group: Group, currentUserId: string) {
  return group.members.find((m) => m.userId !== currentUserId)
}

export function Sidebar({ selectedGroupId, onSelectGroup, onGroupClosed }: SidebarProps) {
  const { data: user } = useCurrentUser()
  const { data: groups, isLoading } = useGroups()
  const { data: friends } = useFriends()
  const { data: pendingRequests } = usePendingRequests()
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds)
  const unreadCounts = useUnreadStore((s) => s.unreadCounts)
  const hideGroup = useHideGroup()
  const [groupModalGroupId, setGroupModalGroupId] = useState<number | null | undefined>(undefined) // undefined = closed
  const [groupMenu, setGroupMenu] = useState<{ x: number; y: number; group: Group; isAdmin: boolean } | null>(null)
  const [leaveTarget, setLeaveTarget] = useState<Group | null>(null)
  const leaveGroup = useLeaveGroup()
  const [friendsViewOpen, setFriendsViewOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { menu, menuItems, confirmTarget, openMenu, closeMenu, confirmRemove, cancelRemove } =
    useFriendContextMenu()

  usePresenceSync(groups)

  const isSearching = searchQuery.trim().length > 0

  const sortedGroups = [...(groups ?? [])].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
    return bTime - aTime
  })

  return (
    <aside className="flex h-full w-full flex-col border-r border-line bg-panel text-white md:w-72">
      <div className="flex items-center justify-between px-5 pt-5">
        <h1 className="font-display text-2xl">Converseo</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupModalGroupId(null)}
            aria-label="Create a group"
            className="text-white/60 hover:text-white"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={() => setFriendsViewOpen((open) => !open)}
            aria-label="Friends"
            className="text-white/60 hover:text-white"
          >
            <UsersIcon size={18} />
          </button>
        </div>
      </div>

      {friendsViewOpen ? (
        <FriendsView
          onClose={() => setFriendsViewOpen(false)}
          onOpenConversation={(groupId) => {
            onSelectGroup(groupId)
            setFriendsViewOpen(false)
          }}
        />
      ) : (
        <>
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
                <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-white/50 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {isSearching ? (
            <FriendSearchResults query={searchQuery} onOpenConversation={onSelectGroup} />
          ) : (
            <nav className="flex-1 overflow-y-auto px-2 pb-4">
              {isLoading && <p className="px-3 py-2 text-sm text-white/50">Loading conversations…</p>}
              {sortedGroups.length === 0 && (
                <p className="px-3 py-2 text-sm text-white/50">No conversations yet.</p>
              )}

              {sortedGroups.map((group) => {
                const other = user ? otherMember(group, user.id) : undefined
                const displayName = group.isDirectMessage ? (other?.displayName ?? group.name) : group.name
                const avatarUrl = group.isDirectMessage ? (other?.avatarUrl ?? null) : group.iconUrl
                const isOnline = group.isDirectMessage && !!other && onlineUserIds.has(other.userId)
                const unread = unreadCounts[group.id] ?? 0
                const myRole = user ? group.members.find((m) => m.userId === user.id)?.role : undefined

                return (
                  <button
                    key={group.id}
                    onClick={() => onSelectGroup(group.id)}
                    onContextMenu={(e) => {
                      if (group.isDirectMessage) {
                        if (!other) return
                        const { status, friendshipId } = getRelationshipStatus(other.userId, friends, pendingRequests)
                        openMenu(e, {
                          userId: other.userId,
                          displayName: other.displayName,
                          status,
                          friendshipId,
                          extraItems: [
                            {
                              label: 'Close conversation',
                              onClick: () => {
                                hideGroup.mutate(group.id)
                                if (group.id === selectedGroupId) onGroupClosed(group.id)
                              },
                            },
                          ],
                        })
                      } else {
                        e.preventDefault()
                        setGroupMenu({ x: e.clientX, y: e.clientY, group, isAdmin: myRole === 'Admin' })
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-white/10 ${
                      group.id === selectedGroupId ? 'bg-white/10' : ''
                    }`}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={displayName} avatarUrl={avatarUrl} size="sm" />
                      <OnlineDot online={isOnline} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${unread > 0 ? 'font-semibold text-white' : 'font-medium'}`}>
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-white/50">
                        {user ? formatConversationPreview(group, user.id) : ''}
                      </p>
                    </div>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          )}
        </>
      )}

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={closeMenu} />}

      {confirmTarget && (
        <ConfirmDialog
          title="Remove friend?"
          message={`${confirmTarget.displayName} will be removed from your friends. You can send a new request later if you change your mind.`}
          confirmLabel="Remove"
          onCancel={cancelRemove}
          onConfirm={confirmRemove}
        />
      )}
      {groupMenu && (
        <ContextMenu
          x={groupMenu.x}
          y={groupMenu.y}
          onClose={() => setGroupMenu(null)}
          items={[
            ...(groupMenu.isAdmin
              ? [{ label: 'Edit group', onClick: () => setGroupModalGroupId(groupMenu.group.id) }]
              : []),
            { label: 'Leave group', danger: true, onClick: () => setLeaveTarget(groupMenu.group) },
          ]}
        />
      )}

      {leaveTarget && (
        <ConfirmDialog
          title="Leave group?"
          message={`You'll stop receiving messages from "${leaveTarget.name}" until someone adds you back.`}
          confirmLabel="Leave"
          onCancel={() => setLeaveTarget(null)}
          onConfirm={() => {
            leaveGroup.mutate(leaveTarget.id)
            if (leaveTarget.id === selectedGroupId) onGroupClosed(leaveTarget.id)
            setLeaveTarget(null)
          }}
        />
      )}

      {groupModalGroupId !== undefined && (
        <GroupModal
          groupId={groupModalGroupId}
          onClose={() => setGroupModalGroupId(undefined)}
          onOpenConversation={onSelectGroup}
        />
      )}

      <button
        onClick={() => setProfileOpen(true)}
        className="flex items-center gap-3 border-t border-white/10 px-4 py-4 text-left transition-colors hover:bg-white/10"
      >
        <Avatar name={user?.displayName ?? ''} avatarUrl={user?.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.displayName}</p>
          <p className="truncate text-xs text-white/50">{user?.email}</p>
        </div>
      </button>

      {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} />}
    </aside>
  )
}