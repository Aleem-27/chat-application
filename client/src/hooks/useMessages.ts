import { useQuery } from '@tanstack/react-query'
import { messagesApi } from '@/api/messagesApi'

export function useMessages(groupId: number | null) {
  return useQuery({
    queryKey: ['messages', groupId],
    queryFn: () => messagesApi.getMessages(groupId!),
    enabled: groupId !== null,
  })
}