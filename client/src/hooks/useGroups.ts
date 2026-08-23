import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groupsApi'


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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}