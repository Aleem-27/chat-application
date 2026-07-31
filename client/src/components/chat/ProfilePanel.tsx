import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Camera, LogOut, X, User, Lock, Palette, Users, Save, Upload, } from 'lucide-react' 
import { useChangePassword, useCurrentUser, useLogout, useUpdateProfile,} from '@/hooks/useAuth' 
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
      onSuccess: (result) =>
        updateProfile.mutate({
          avatarUrl: result.fileUrl,
        }),
    })
  }

  function handleProfileSave(event: FormEvent) {
    event.preventDefault()
    updateProfile.mutate({displayName, email})
  }

  function handlePasswordSave(event: FormEvent) {
    event.preventDefault()
    changePassword.mutate({currentPassword, newPassword}, {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-canvas flex flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-5">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Profile & Settings</h2>
            <p className="mt-1 text-sm text-ink-soft">Manage your account, appearance and friends.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2  text-ink hover:bg-surface">
            <X size={22} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-8 py-8">
          <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <label className="group relative cursor-pointer">
                <Avatar name={user?.displayName ?? ''} avatarUrl={user?.avatarUrl} size="xl"/>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0  group-hover:opacity-100">
                  <div className="rounded-full bg-white p-2 text-black">
                    <Camera size={18} />
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
              </label>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-ink">{user?.displayName}</h3>
                <p className="text-sm text-ink-soft">{user?.email}</p>
              </div>

              {uploadFile.isPending && (
                <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent">
                  <Upload size={16} />Uploading profile picture...
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-3 text-accent">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">Account Information</h3>
                <p className="text-sm text-ink-soft">Update your public profile details.</p>
              </div>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink  focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink  focus:border-accent focus:outline-none"
                />
              </div>

              {updateProfile.isError && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {getErrorMessage(updateProfile.error)}
                </div>
              )}

              {updateProfile.isSuccess && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                  Your profile has been updated successfully.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-medium text-white  hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={18} />
                  {updateProfile.isPending
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-3 text-accent">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">Change Password</h3>
                <p className="text-sm text-ink-soft">Use a strong password with at least 8 characters.</p>
              </div>
            </div>
            <form onSubmit={handlePasswordSave}className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink outline-none  focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink">New Password</label>
                <input
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-ink outline-none  focus:border-accent"
                />
              </div>

              {changePassword.isError && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {getErrorMessage(changePassword.error)}
                </div>
              )}

              {changePassword.isSuccess && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-600">
                  Password updated successfully.
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="rounded-xl bg-accent px-6 py-3 font-medium text-white  hover:opacity-90 disabled:opacity-60"
                >
                  {changePassword.isPending
                    ? 'Updating...'
                    : 'Update Password'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 p-3 text-accent">
                  <Palette size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Appearance</h3>
                  <p className="text-sm text-ink-soft">Customize how the application looks.</p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-xl border border-line px-5 py-3 bg-surface text-ink text-sm font-medium  hover:bg-accent/10"
              >
                {theme === 'dark'
                  ? '☀ Light Mode'
                  : '🌙 Dark Mode'}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-accent/10 p-3 text-accent">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-ink">Friends</h3>
                <p className="text-sm text-ink-soft">
                  {friends?.length ?? 0} friend
                  {(friends?.length ?? 0) !== 1 && 's'}
                </p>
              </div>
            </div>

            {friends?.length === 0 && (

              <div className="rounded-xl border border-dashed border-line py-10 text-center">
                <Users size={40} className="mx-auto mb-4 text-ink-soft"/>
                <p className="font-medium text-ink">No Friends Yet</p>
                <p className="mt-1 text-sm text-ink-soft">Add friends to start chatting together.</p>
              </div>
            )}

            <div className="space-y-3">
              {friends?.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center rounded-xl border border-line bg-canvas p-4  hover:border-accent"
                >
                  <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} size="sm"/>
                  <div className="ml-4 flex-1">
                    <p className="font-medium text-ink">{friend.displayName}</p>
                    <p className="text-sm text-ink-soft">{friend.email}</p>
                  </div>
                  <button
                    onClick={() => setRemoveTarget(friend)}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-danger  hover:bg-danger/10"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-danger/20 bg-surface p-8">
            <h3 className="text-lg font-semibold text-danger">Danger Zone</h3>
            <p className="mt-2 mb-6 text-sm text-ink-soft">Logging out will end your current session on this device.</p>
            <button
              onClick={() => logout.mutate()}
              className="flex items-center gap-3 rounded-xl bg-danger px-6 py-3 font-medium text-white  hover:opacity-90"
            >
              <LogOut size={18} />Log Out
            </button>
          </section>
        </div>
      </div>

      {removeTarget && (
        <ConfirmDialog
          title="Remove Friend?"
          message={`Are you sure you want to remove ${removeTarget.displayName} from your friends list?`}
          confirmLabel="Remove Friend"
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