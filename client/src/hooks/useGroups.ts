import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groupsApi'
import type { Group, UpdateGroupPayload } from '@/types/chat'


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

export function useCreateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.createGroup,
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(['groups'], (groups) => {
        if (!groups) return [group]
        const exists = groups.some((g) => g.id === group.id)
        return exists ? groups.map((g) => (g.id === group.id ? group : g)) : [...groups, group]
      })
    },
  })
}

export function useUpdateGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateGroupPayload & { id: number }) =>
      groupsApi.updateGroup(payload.id, payload),
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(['groups'], (groups) =>
        groups?.map((g) => (g.id === group.id ? group : g))
      )
    },
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (groupId: number) => groupsApi.leaveGroup(groupId),
    onSuccess: (_data, groupId) => {
      queryClient.setQueryData<Group[]>(['groups'], (groups) => groups?.filter((g) => g.id !== groupId))
    },
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