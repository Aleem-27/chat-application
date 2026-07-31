import { apiClient } from './apiClient'
import type { LoginPayload, RegisterPayload, UpdateProfilePayload, ChangePasswordPayload, UserResponse } from '@/types/auth'

export const authApi = {
  register: (payload: RegisterPayload) => apiClient.post<UserResponse>('/auth/register', payload).then((res) => res.data),

  login: (payload: LoginPayload) => apiClient.post<UserResponse>('/auth/login', payload).then((res) => res.data),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<UserResponse>('/auth/me').then((res) => res.data),

  updateProfile: (payload: UpdateProfilePayload) => apiClient.patch<UserResponse>('/auth/me', payload).then((res) => res.data),

  changePassword: (payload: ChangePasswordPayload) => apiClient.post('/auth/change-password', payload),
}