import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, LogOut, X } from 'lucide-react'
import { useChangePassword, useCurrentUser, useLogout, useUpdateProfile } from '@/hooks/useAuth'
import { useFriends, useRemoveFriend } from '@/hooks/useFriends'
import { useFileUpload } from '@/hooks/useFileUpload'
import { useThemeStore } from '@/store/themeStore'
import { Avatar } from '@/components/shared/Avatar'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { getErrorMessage } from '@/lib/errors'
import type { Friendship } from '@/types/friends'

export function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const uploadFile = useFileUpload()
  const { data: friends } = useFriends()
  const removeFriend = useRemoveFriend()
  const { theme, toggleTheme } = useThemeStore()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [removeTarget, setRemoveTarget] = useState<Friendship | null>(null)

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    uploadFile.mutate(file, {
      onSuccess: (result) => updateProfile.mutate({ avatarUrl: result.fileUrl }),
    })
  }

  function handleProfileSave(event: FormEvent) {
    event.preventDefault()
    updateProfile.mutate({ displayName, email })
  }

  function handlePasswordSave(event: FormEvent) {
    event.preventDefault()
    changePassword.mutate(
      { currentPassword, newPassword },
      { onSuccess: () => { setCurrentPassword(''); setNewPassword('') } }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 className="font-display text-xl text-ink">Profile & settings</h2>
        <button onClick={onClose} aria-label="Close" className="text-ink-soft hover:text-ink">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-8">
          <div className="flex flex-col items-center gap-2">
            <label className="group relative cursor-pointer">
              <Avatar name={user?.displayName ?? ''} avatarUrl={user?.avatarUrl} size="md" />
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={16} />
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            {uploadFile.isPending && <p className="text-xs text-ink-soft">Uploading…</p>}
          </div>

          <form onSubmit={handleProfileSave} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-ink-soft">Account</h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-soft">Display name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-ink-soft">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
              />
            </div>
            {updateProfile.isError && <p className="text-sm text-danger">{getErrorMessage(updateProfile.error)}</p>}
            {updateProfile.isSuccess && <p className="text-sm text-signal">Saved.</p>}
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Save changes
            </button>
          </form>

          <form onSubmit={handlePasswordSave} className="flex flex-col gap-3 border-t border-line pt-6">
            <h3 className="text-sm font-medium text-ink-soft">Change password</h3>
            <input
              type="password"
              placeholder="Current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
            <input
              type="password"
              placeholder="New password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-md border border-line bg-surface px-3 py-2 text-ink outline-none focus:border-accent"
            />
            {changePassword.isError && <p className="text-sm text-danger">{getErrorMessage(changePassword.error)}</p>}
            {changePassword.isSuccess && <p className="text-sm text-signal">Password updated.</p>}
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="self-start rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Update password
            </button>
          </form>

          <div className="flex items-center justify-between border-t border-line pt-6">
            <h3 className="text-sm font-medium text-ink-soft">Appearance</h3>
            <button
              onClick={toggleTheme}
              className="rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-accent-tint"
            >
              {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            </button>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-6">
            <h3 className="text-sm font-medium text-ink-soft">Friends ({friends?.length ?? 0})</h3>
            {friends?.length === 0 && <p className="text-sm text-ink-soft">No friends yet.</p>}
            {friends?.map((friend) => (
              <div key={friend.id} className="flex items-center gap-3">
                <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{friend.displayName}</p>
                  <p className="truncate text-xs text-ink-soft">{friend.email}</p>
                </div>
                <button onClick={() => setRemoveTarget(friend)} className="text-xs font-medium text-danger">
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => logout.mutate()}
            className="flex w-fit items-center justify-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Remove friend?"
          message={`${removeTarget.displayName} will be removed from your friends.`}
          confirmLabel="Remove"
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            removeFriend.mutate(removeTarget.id)
            setRemoveTarget(null)
          }}
        />
      )}
    </div>
  )
} 