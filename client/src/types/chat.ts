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
  iconUrl: string | null
  createdAt: string
  members: GroupMember[]
  lastMessage: LastMessagePreview | null
  lastMessageAt: string | null
}

export interface CreateGroupPayload {
  name: string
  iconUrl?: string | null
  memberUserIds: string[]
}

export interface UpdateGroupPayload {
  name?: string
  iconUrl?: string | null
  addMemberUserIds?: string[]
  assignAdminUserId?: string
}

export interface Message {
  id: number
  groupId: number
  content: string | null
  sentAt: string
  editedAt: string | null
  isDeleted: boolean
  senderId: string
  senderDisplayName: string
  readByUserIds: string[]
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

export interface MessageBlocked {
  groupId: number
  reason: string
  targetUserId: string
  targetDisplayName: string
}

export interface LastMessagePreview {
  senderId: string
  senderDisplayName: string
  content: string | null
  hasFile: boolean
  fileName: string | null
  isDeleted: boolean
  sentAt: string
}