export interface Friendship {
  id: number
  userId: string
  displayName: string
  email: string
  avatarUrl: string | null
  status: 'Pending' | 'Accepted' | 'Declined'
  isIncoming: boolean
}