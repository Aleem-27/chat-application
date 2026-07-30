import { useState, type FormEvent } from 'react'
import { useSendFriendRequest, usePendingRequests, useRespondToRequest } from '@/hooks/useFriends'
import { getErrorMessage } from '@/lib/errors'
import { Avatar } from '@/components/shared/Avatar'

export function AddFriendPanel({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const sendRequest = useSendFriendRequest()
  const { data: requests } = usePendingRequests()
  const respond = useRespondToRequest()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    sendRequest.mutate(email, { onSuccess: () => setEmail('') })
  }

  const incoming = requests?.filter((r) => r.isIncoming) ?? []

  return (
    <div className="flex flex-col gap-4 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="text-sm font-medium text-white/70">Add a friend by email</label>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@example.com"
            className="flex-1 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={sendRequest.isPending}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {sendRequest.isError && (
          <p className="text-xs text-danger">{getErrorMessage(sendRequest.error)}</p>
        )}
        {sendRequest.isSuccess && <p className="text-xs text-signal">Friend request sent.</p>}
      </form>

      {incoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-white/70">Pending requests</p>
          {incoming.map((request) => (
            <div key={request.id} className="flex items-center gap-2">
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
                Decline
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={onClose} className="text-xs text-white/50 hover:text-white">
        Close
      </button>
    </div>
  )
}