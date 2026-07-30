import { apiClient } from './apiClient'
import type { Friendship } from '@/types/friends'

export const friendsApi = {
  sendRequest: (email: string) =>
    apiClient.post<Friendship>('/friends/requests', { email }).then((res) => res.data),
  accept: (id: number) =>
    apiClient.post<Friendship>(`/friends/requests/${id}/accept`).then((res) => res.data),
  decline: (id: number) =>
    apiClient.post<Friendship>(`/friends/requests/${id}/decline`).then((res) => res.data),
  getFriends: () => apiClient.get<Friendship[]>('/friends').then((res) => res.data),
  getPendingRequests: () => apiClient.get<Friendship[]>('/friends/requests').then((res) => res.data),
  removeFriend: (id: number) => apiClient.delete(`/friends/${id}`),
}