'use client'

interface UserAvatarProps {
  user: {
    name: string
    avatar_color?: string
    photo_url?: string
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBadge?: boolean
  badgeContent?: React.ReactNode
}

export function UserAvatar({ 
  user, 
  size = 'md', 
  className = '',
  showBadge = false,
  badgeContent
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-20 h-20 text-xl',
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = user.avatar_color || '#0ea5e9'
  const sizeClass = sizeClasses[size]

  return (
    <div className={`relative ${className}`}>
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-200 dark:ring-slate-700 overflow-hidden`}
        style={{ backgroundColor: avatarColor }}
      >
        {user.photo_url ? (
          <img
            src={user.photo_url}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = initials
              }
            }}
          />
        ) : (
          initials
        )}
      </div>
      {showBadge && badgeContent && (
        <div className="absolute -top-1 -right-1 z-10">
          {badgeContent}
        </div>
      )}
    </div>
  )
}

