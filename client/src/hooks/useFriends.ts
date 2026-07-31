import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { friendsApi } from '@/api/friendsApi'

export function useFriends() {
  return useQuery({ queryKey: ['friends'], queryFn: friendsApi.getFriends })
}

export function usePendingRequests() {
  return useQuery({ queryKey: ['friends', 'requests'], queryFn: friendsApi.getPendingRequests })
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendsApi.sendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
}

export function useSendFriendRequestByUserId() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendsApi.sendRequestByUserId,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
}

export function useRespondToRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, accept }: { id: number; accept: boolean }) =>
      accept ? friendsApi.accept(id) : friendsApi.decline(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
}

export function useRemoveFriend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: friendsApi.removeFriend,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  })
}