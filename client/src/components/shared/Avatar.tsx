interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}

export function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const dimension = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${dimension} rounded-full object-cover`} />
  }

  return (
    <div
      className={`${dimension} flex items-center justify-center rounded-full bg-accent-tint font-medium text-accent`}
    >
      {initials}
    </div>
  )
}