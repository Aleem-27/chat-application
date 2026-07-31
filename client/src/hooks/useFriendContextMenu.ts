import { useState, type MouseEvent } from 'react'
import { useRemoveFriend, useSendFriendRequestByUserId } from './useFriends'

interface MenuTarget {
  x: number
  y: number
  friendshipId: number | null
  userId: string
  displayName: string
}

export function useFriendContextMenu() {
  const [menu, setMenu] = useState<MenuTarget | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<MenuTarget | null>(null)
  const removeFriend = useRemoveFriend()
  const sendRequest = useSendFriendRequestByUserId()

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

  return { menu, confirmTarget, openMenu, closeMenu, requestRemove, confirmRemove, cancelRemove, addFriend }
}