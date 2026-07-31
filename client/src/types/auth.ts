export interface RegisterPayload {
  email: string
  password: string
  displayName: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UserResponse {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
}

export interface UpdateProfilePayload {
  displayName?: string
  email?: string
  avatarUrl?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}