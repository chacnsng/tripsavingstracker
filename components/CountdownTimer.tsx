'use client'

import { useEffect, useState } from 'react'
import { differenceInDays, differenceInHours, isPast, isToday } from 'date-fns'

interface CountdownTimerProps {
  targetDate: string
  className?: string
}

export function CountdownTimer({ targetDate, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    status: 'upcoming' | 'today' | 'past'
  }>({ days: 0, hours: 0, status: 'upcoming' })

  useEffect(() => {
    const updateTimer = () => {
      const target = new Date(targetDate)
      const now = new Date()

      if (isPast(target) && !isToday(target)) {
        setTimeLeft({ days: 0, hours: 0, status: 'past' })
        return
      }

      if (isToday(target)) {
        const hours = differenceInHours(target, now)
        setTimeLeft({ days: 0, hours: Math.max(0, hours), status: 'today' })
        return
      }

      const days = differenceInDays(target, now)
      const hours = differenceInHours(target, now) % 24
      setTimeLeft({ days, hours, status: 'upcoming' })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [targetDate])

  const getStatusText = () => {
    if (timeLeft.status === 'past') return 'Trip Completed'
    if (timeLeft.status === 'today') return 'Trip Day!'
    return 'Days Until Trip'
  }

  const getDisplayText = () => {
    if (timeLeft.status === 'past') return 'Completed'
    if (timeLeft.status === 'today') {
      return timeLeft.hours > 0 ? `${timeLeft.hours}h remaining` : 'Today!'
    }
    return `${timeLeft.days}d ${timeLeft.hours}h`
  }

  const isWhiteText = className.includes('text-white')
  
  return (
    <div className={`flex flex-col ${isWhiteText ? 'items-start' : 'items-center'} ${className}`}>
      <span className={`text-xs font-medium mb-1.5 uppercase tracking-wide ${
        isWhiteText 
          ? 'text-white/90' 
          : 'text-slate-500 dark:text-slate-400'
      }`}>
        {getStatusText()}
      </span>
      <div className={`inline-flex items-baseline gap-1 px-4 py-2 rounded-xl ${
        isWhiteText
          ? 'bg-white/20 backdrop-blur-sm border border-white/30'
          : timeLeft.status === 'today' 
          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
          : timeLeft.status === 'past'
          ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          : 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300'
      }`}>
        <span className={`text-2xl font-bold tabular-nums ${
          isWhiteText
            ? 'text-white'
            : timeLeft.status === 'today' 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : timeLeft.status === 'past'
            ? 'text-slate-500 dark:text-slate-400'
            : 'text-sky-600 dark:text-sky-400'
        }`}>
          {getDisplayText()}
        </span>
      </div>
    </div>
  )
}

