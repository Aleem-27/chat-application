export interface GroupMember {
  userId: string
  displayName: string
  avatarUrl: string | null
  role: 'Member' | 'Admin'
  isOnline: boolean
}

export interface Group {
  id: number
  name: string
  isDirectMessage: boolean
  createdAt: string
  members: GroupMember[]
}

export interface Message {
  id: number
  groupId: number
  content: string | null
  sentAt: string
  senderId: string
  senderDisplayName: string
  fileUrl: string | null
  fileName: string | null
  fileSizeBytes: number | null
  fileContentType: string | null
}

export interface ReadReceipt {
  messageId: number
  userId: string
  readAt: string
}