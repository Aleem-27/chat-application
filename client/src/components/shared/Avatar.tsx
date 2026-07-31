import { resolveFileUrl } from '@/lib/files'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md'
}

export function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const dimension = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const resolvedSrc = avatarUrl ? resolveFileUrl(avatarUrl) : null

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={name} className={`${dimension} rounded-full object-cover`} />
  }

  return (
    <div className={`${dimension} flex items-center justify-center rounded-full bg-accent-tint font-medium text-accent`}>
      {initials}
    </div>
  )
}