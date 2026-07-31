import { useState, type MouseEvent } from 'react'
import { useRemoveFriend, useSendFriendRequestByUserId, useRespondToRequest } from './useFriends'
import type { RelationshipStatus } from '@/lib/friends'

interface MenuTarget {
  x: number
  y: number
  userId: string
  displayName: string
  status: RelationshipStatus
  friendshipId: number | null
}

export function useFriendContextMenu() {
  const [menu, setMenu] = useState<MenuTarget | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<MenuTarget | null>(null)
  const removeFriend = useRemoveFriend()
  const sendRequest = useSendFriendRequestByUserId()
  const respond = useRespondToRequest()

  function openMenu(event: MouseEvent, target: Omit<MenuTarget, 'x' | 'y'>) {
    event.preventDefault()
    setMenu({ ...target, x: event.clientX, y: event.clientY })
  }

  function closeMenu() {
    setMenu(null)
  }

  function requestRemove() {
    if (menu) setConfirmTarget(menu)
    closeMenu()
  }

  function confirmRemove() {
    if (confirmTarget?.friendshipId) removeFriend.mutate(confirmTarget.friendshipId)
    setConfirmTarget(null)
  }

  function cancelRemove() {
    setConfirmTarget(null)
  }

  function addFriend() {
    if (menu) sendRequest.mutate(menu.userId)
    closeMenu()
  }

  function acceptIncoming() {
    if (menu?.friendshipId) respond.mutate({ id: menu.friendshipId, accept: true })
    closeMenu()
  }

  function declineIncoming() {
    if (menu?.friendshipId) respond.mutate({ id: menu.friendshipId, accept: false })
    closeMenu()
  }

  const menuItems = menu
    ? menu.status === 'friend'
      ? [{ label: 'Remove friend', danger: true, onClick: requestRemove }]
      : menu.status === 'outgoing'
        ? [{ label: 'Friend request pending', disabled: true, onClick: () => {} }]
        : menu.status === 'incoming'
          ? [
              { label: 'Accept friend request', onClick: acceptIncoming },
              { label: 'Decline request', danger: true, onClick: declineIncoming },
            ]
          : [{ label: 'Add friend', onClick: addFriend }]
    : []

  return { menu, menuItems, confirmTarget, openMenu, closeMenu, confirmRemove, cancelRemove }
}