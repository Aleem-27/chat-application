import { apiClient } from './apiClient'
import type { Group } from '@/types/chat'

export const groupsApi = {
  getMyGroups: () => apiClient.get<Group[]>('/groups').then((res) => res.data),
  getGroup: (id: number) => apiClient.get<Group>(`/groups/${id}`).then((res) => res.data),
  hideGroup: (groupId: number) => apiClient.post(`/groups/${groupId}/hide`),
  createDirectMessage: (targetUserId: string) =>
    apiClient.post<Group>('/groups/direct', { targetUserId }).then((res) => res.data),
}