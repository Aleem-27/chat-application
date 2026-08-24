import { apiClient } from './apiClient'
import type { CreateGroupPayload, Group, UpdateGroupPayload } from '@/types/chat'

export const groupsApi = {
  getMyGroups: () => apiClient.get<Group[]>('/groups').then((res) => res.data),
  getGroup: (id: number) => apiClient.get<Group>(`/groups/${id}`).then((res) => res.data),
  hideGroup: (groupId: number) => apiClient.post(`/groups/${groupId}/hide`),
  createGroup: (payload: CreateGroupPayload) =>
  apiClient.post<Group>('/groups', payload).then((res) => res.data),
  updateGroup: (id: number, payload: UpdateGroupPayload) =>
    apiClient.patch<Group>(`/groups/${id}`, payload).then((res) => res.data),
  leaveGroup: (id: number) => apiClient.post(`/groups/${id}/leave`),
  createDirectMessage: (targetUserId: string) =>
    apiClient.post<Group>('/groups/direct', { targetUserId }).then((res) => res.data),
}