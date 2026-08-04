import { create } from 'zustand'

interface UnreadState {
  unreadCounts: Record<number, number>
  increment: (groupId: number) => void
  clear: (groupId: number) => void
}

export const useUnreadStore = create<UnreadState>((set) => ({
  unreadCounts: {},
  increment: (groupId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [groupId]: (state.unreadCounts[groupId] ?? 0) + 1 },
    })),
  clear: (groupId) =>
    set((state) => {
      if (!state.unreadCounts[groupId]) return state
      const next = { ...state.unreadCounts }
      delete next[groupId]
      return { unreadCounts: next }
    }),
}))