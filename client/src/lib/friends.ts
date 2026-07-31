import type { Friendship } from '@/types/friends'

export type RelationshipStatus = 'friend' | 'incoming' | 'outgoing' | 'none'

export function getRelationshipStatus(
  userId: string,
  friends: Friendship[] | undefined,
  pendingRequests: Friendship[] | undefined
): { status: RelationshipStatus; friendshipId: number | null } {
  const friend = friends?.find((f) => f.userId === userId)
  if (friend) return { status: 'friend', friendshipId: friend.id }

  const request = pendingRequests?.find((r) => r.userId === userId)
  if (request) return { status: request.isIncoming ? 'incoming' : 'outgoing', friendshipId: request.id }

  return { status: 'none', friendshipId: null }
}