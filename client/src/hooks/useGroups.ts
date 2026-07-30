import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { groupsApi } from '@/api/groupsApi'


export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: groupsApi.getMyGroups,
  })
}

export function useCreateDirectMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: groupsApi.createDirectMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groups'] }),
  })
}