import { resolveFileUrl } from '@/lib/files'

interface AvatarProps {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Avatar({ name, avatarUrl, size = 'md' }: AvatarProps) {
  const dimensions = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-20 w-20 text-xl', xl: 'h-28 w-28 text-3xl' }
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const resolvedSrc = avatarUrl ? resolveFileUrl(avatarUrl) : null

  if (resolvedSrc) {
    return <img src={resolvedSrc} alt={name} className={`${dimensions[size]} rounded-full object-cover`} />
  }

  return (
    <div className={`${dimensions[size]} flex items-center justify-center rounded-full bg-accent-tint font-medium text-accent`}>
      {initials}
    </div>
  )
}