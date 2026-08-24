import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, X } from 'lucide-react'
import { useCurrentUser } from '@/hooks/useAuth'
import { useCreateGroup, useGroups, useUpdateGroup } from '@/hooks/useGroups'
import { useFriends } from '@/hooks/useFriends'
import { useFileUpload } from '@/hooks/useFileUpload'
import { Avatar } from '@/components/shared/Avatar'
import { getErrorMessage } from '@/lib/errors'

interface GroupModalProps {
  groupId: number | null // null = create mode
  onClose: () => void
  onOpenConversation: (groupId: number) => void
}

export function GroupModal({ groupId, onClose, onOpenConversation }: GroupModalProps) {
  const { data: user } = useCurrentUser()
  const { data: groups } = useGroups()
  const { data: friends } = useFriends()
  const uploadIcon = useFileUpload()
  const createGroup = useCreateGroup()
  const updateGroup = useUpdateGroup()

  const existingGroup = groupId ? groups?.find((g) => g.id === groupId) : undefined
  const isEdit = !!existingGroup

  const [name, setName] = useState(existingGroup?.name ?? '')
  const [iconUrl, setIconUrl] = useState<string | null>(existingGroup?.iconUrl ?? null)
  const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set())
  const [assignAdminUserId, setAssignAdminUserId] = useState<string | null>(null)

  const existingMemberIds = new Set(existingGroup?.members.map((m) => m.userId) ?? [])
  const selectableFriends = friends?.filter((f) => !existingMemberIds.has(f.userId)) ?? []
  const currentAdminId = existingGroup?.members.find((m) => m.role === 'Admin')?.userId

  function toggleFriend(userId: string) {
    setSelectedFriendIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  function handleIconChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    uploadIcon.mutate(file, { onSuccess: (result) => setIconUrl(result.fileUrl) })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (isEdit && existingGroup) {
      updateGroup.mutate(
        {
          id: existingGroup.id,
          name: name !== existingGroup.name ? name : undefined,
          iconUrl: iconUrl !== existingGroup.iconUrl ? iconUrl : undefined,
          addMemberUserIds: Array.from(selectedFriendIds),
          assignAdminUserId: assignAdminUserId ?? undefined,
        },
        { onSuccess: () => onClose() }
      )
    } else {
      createGroup.mutate(
        { name, iconUrl, memberUserIds: Array.from(selectedFriendIds) },
        {
          onSuccess: (group) => {
            onOpenConversation(group.id)
            onClose()
          },
        }
      )
    }
  }

  const mutationError = isEdit ? updateGroup.error : createGroup.error
  const isPending = isEdit ? updateGroup.isPending : createGroup.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="flex h-[80vh] w-[80vw] max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
        <header className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-display text-lg text-ink">{isEdit ? 'Edit group' : 'Create a group'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
            <X size={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
            <div className="flex items-center gap-4">
              <label className="group relative cursor-pointer">
                <Avatar name={name || 'G'} avatarUrl={iconUrl} size="xl" />
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={16} />
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
              </label>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-ink-soft">Group name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What's this group called?"
                  className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-accent"
                />
              </div>
            </div>

            {isEdit && existingGroup && (
              <div>
                <p className="mb-2 text-sm font-medium text-ink-soft">Admin</p>
                <select
                  value={assignAdminUserId ?? currentAdminId}
                  onChange={(e) => setAssignAdminUserId(e.target.value)}
                  className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-ink outline-none focus:border-accent"
                >
                  {existingGroup.members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.displayName}
                      {m.userId === user?.id ? ' (you)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-ink-soft">
                {isEdit ? 'Add friends' : 'Add friends to the group'}
              </p>
              <div className="flex flex-col gap-1">
                {selectableFriends.length === 0 && (
                  <p className="text-sm text-ink-soft">
                    {isEdit ? 'All your friends are already in this group.' : 'You have no friends to add yet.'}
                  </p>
                )}
                {selectableFriends.map((friend) => (
                  <label
                    key={friend.userId}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-accent-tint"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFriendIds.has(friend.userId)}
                      onChange={() => toggleFriend(friend.userId)}
                      className="h-4 w-4 accent-accent"
                    />
                    <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size="sm" />
                    <span className="text-sm text-ink">{friend.displayName}</span>
                  </label>
                ))}
              </div>
            </div>

            {mutationError && (
              <p className="text-sm text-danger">{getErrorMessage(mutationError)}</p>
            )}
          </div>

          <footer className="flex justify-end gap-2 border-t border-line px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-ink-soft hover:bg-accent-tint"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !name.trim()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isEdit ? 'Save changes' : 'Create group'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}