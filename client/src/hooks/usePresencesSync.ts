import { useEffect } from 'react'
import { usePresenceStore } from '@/store/presenceStore'
import type { Group } from '@/types/chat'

export function usePresenceSync(groups: Group[] | undefined) {
  const setInitialOnline = usePresenceStore((state) => state.setInitialOnline)

  useEffect(() => {
    if (!groups) return
    const onlineIds = groups.flatMap((group) =>
      group.members.filter((member) => member.isOnline).map((member) => member.userId)
    )
    setInitialOnline(onlineIds)
  }, [groups, setInitialOnline])
}