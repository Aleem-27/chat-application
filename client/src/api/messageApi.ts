import { apiClient } from './apiClient'
import type { Message } from '@/types/chat'

export const messagesApi = {
  getMessages: (groupId: number, page = 1, pageSize = 50) =>
    apiClient
      .get<Message[]>(`/groups/${groupId}/messages`, { params: { page, pageSize } })
      .then((res) => res.data),
}