import { useInfiniteQuery } from '@tanstack/react-query'
import { messagesApi } from '@/api/messagesApi'

const PAGE_SIZE = 50

export function useMessages(groupId: number | null) {
  return useInfiniteQuery({
    queryKey: ['messages', groupId],
    queryFn: ({ pageParam }) => messagesApi.getMessages(groupId!, pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
    enabled: groupId !== null,
  })
}