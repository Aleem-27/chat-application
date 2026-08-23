import type { Group } from '@/types/chat'

export function formatConversationPreview(group: Group, currentUserId: string): string {
  const lm = group.lastMessage
  if (!lm) return group.isDirectMessage ? 'Say hello!' : 'No messages yet'

  const body = lm.isDeleted
    ? 'This message was deleted'
    : (lm.content ?? (lm.hasFile ? (lm.fileName ?? 'Sent a file') : ''))

  const isOwn = lm.senderId === currentUserId

  if (group.isDirectMessage) {
    return isOwn ? `You: ${body}` : body
  }

  return `${isOwn ? 'You' : lm.senderDisplayName}: ${body}`
}

export function toLastMessagePreview(message: {
  senderId: string
  senderDisplayName: string
  content: string | null
  fileUrl: string | null
  fileName: string | null
  isDeleted: boolean
  sentAt: string
}) {
  return {
    senderId: message.senderId,
    senderDisplayName: message.senderDisplayName,
    content: message.content,
    hasFile: !!message.fileUrl,
    fileName: message.fileName,
    isDeleted: message.isDeleted,
    sentAt: message.sentAt,
  }
}