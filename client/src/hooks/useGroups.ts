import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groupsApi'
import type { Group } from '@/types/chat'


export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getMyGroups,
  })
}

export function useHideGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => groupsApi.hideGroup(groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}

export function useCreateDirectMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.createDirectMessage,
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(['groups'], (groups) => {
        if (!groups) return [group]
        const exists = groups.some((g) => g.id === group.id)
        return exists ? groups.map((g) => (g.id === group.id ? group : g)) : [...groups, group]
      })
    },
  })
}