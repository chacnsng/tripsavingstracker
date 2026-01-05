'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'

interface ProgressAvatarProps {
  user: {
    id: string
    name: string
    avatar_color?: string
    photo_url?: string
  }
  progress: number // 0-100
  currentSavings: number
  targetAmount: number
  hasReachedGoal: boolean
}

export function ProgressAvatar({
  user,
  progress,
  currentSavings,
  targetAmount,
  hasReachedGoal,
}: ProgressAvatarProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [hasCelebrated, setHasCelebrated] = useState(false)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (hasReachedGoal && !hasCelebrated) {
      setShowConfetti(true)
      setHasCelebrated(true)
      setTimeout(() => setShowConfetti(false), 5000)
    }
  }, [hasReachedGoal, hasCelebrated])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      const handleResize = () => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const avatarColor = user.avatar_color || '#0ea5e9'

  // Get initials for avatar
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative w-full">
      {showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      
      {/* User info header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full text-white font-bold text-base shadow-lg border-3 border-white dark:border-slate-800 relative ring-2 ring-slate-200 dark:ring-slate-700 overflow-hidden"
          style={{ backgroundColor: avatarColor }}
        >
          {user.photo_url ? (
            <img
              src={user.photo_url}
              alt={user.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  const fallback = document.createElement('span')
                  fallback.textContent = initials
                  parent.appendChild(fallback)
                }
              }}
            />
          ) : (
            initials
          )}
          {hasReachedGoal && (
            <span className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1 z-10">
              ✈️
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate mb-0.5">
            {user.name}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            ${currentSavings.toFixed(2)} / ${targetAmount.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
            {progress.toFixed(1)}%
          </p>
          {hasReachedGoal && (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
              Ready!
            </p>
          )}
        </div>
      </div>

      {/* Journey progress bar */}
      <div className="relative w-full h-7 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out relative ${
            progress >= 100
              ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500'
              : progress >= 75
              ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500'
              : progress >= 50
              ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500'
              : 'bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </div>
        
        {/* Milestone markers */}
        {[25, 50, 75, 100].map(milestone => {
          const reached = progress >= milestone
          return (
            <div
              key={milestone}
              className={`absolute top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all duration-300 ${
                reached
                  ? 'bg-white shadow-lg scale-150'
                  : 'bg-slate-400 dark:bg-slate-500 opacity-50'
              }`}
              style={{ left: `${milestone}%` }}
            />
          )
        })}
        
        {/* Destination marker at end */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <svg 
            className={`w-4 h-4 transition-all duration-300 ${
              progress >= 100 
                ? 'text-emerald-600 dark:text-emerald-400 scale-110' 
                : 'text-slate-400 dark:text-slate-500'
            }`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  )
}

