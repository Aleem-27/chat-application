interface TypingIndicatorProps {
  typingUserIds: Set<string>
  members: { userId: string; displayName: string }[]
}

export function TypingIndicator({ typingUserIds, members }: TypingIndicatorProps) {
  const names = members
    .filter((m) => typingUserIds.has(m.userId))
    .map((m) => m.displayName)

  if (names.length === 0) return <div className="h-6" />

  const label =
    names.length === 1
      ? `${names[0]} is typing…`
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} are typing…`

  return <p className="h-6 px-6 text-sm italic text-ink-soft">{label}</p>
}