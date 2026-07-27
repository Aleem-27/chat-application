import { create } from 'zustand'

interface PresenceState {
  onlineUserIds: Set<string>
  setOnline: (userId: string) => void
  setOffline: (userId: string) => void
  setInitialOnline: (userIds: string[]) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: new Set(),
  setOnline: (userId) =>
    set((state) => ({ onlineUserIds: new Set(state.onlineUserIds).add(userId) })),
  setOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUserIds)
      next.delete(userId)
      return { onlineUserIds: next }
    }),
  setInitialOnline: (userIds) => set({ onlineUserIds: new Set(userIds) }),
}))