import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useGroups } from '@/hooks/useGroups'
import { usePresenceSync } from '@/hooks/usePresenceSync'
import { usePresenceStore } from '@/store/presenceStore'
import { Avatar } from '@/components/shared/Avatar'
import { OnlineDot } from '@/components/shared/OnlineDot'
import type { Group } from '@/types/chat'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'

function otherMember(group: Group, currentUserId: string) {
  return group.members.find((m) => m.userId !== currentUserId)
}

interface SidebarProps {
  selectedGroupId: number | null
  onSelectGroup: (groupId: number) => void
}

export function Sidebar({ selectedGroupId, onSelectGroup }: SidebarProps) {
  const { data: user } = useCurrentUser()
  const { data: groups, isLoading } = useGroups()
  const logout = useLogout()
  const onlineUserIds = usePresenceStore((s) => s.onlineUserIds)
  const { theme, toggleTheme } = useThemeStore()

  usePresenceSync(groups)

  return (
    <aside className="flex h-full w-full flex-col bg-panel text-white md:w-72">
      <div className="px-5 py-6">
        <h1 className="font-display text-2xl">Converseo</h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {isLoading && <p className="px-3 py-2 text-sm text-white/50">Loading conversations…</p>}
        {groups?.length === 0 && (
          <p className="px-3 py-2 text-sm text-white/50">No conversations yet.</p>
        )}

        {groups?.map((group) => {
          const other = user ? otherMember(group, user.id) : undefined
          const displayName = group.isDirectMessage ? (other?.displayName ?? group.name) : group.name
          const isOnline = group.isDirectMessage && !!other && onlineUserIds.has(other.userId)

          return (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
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