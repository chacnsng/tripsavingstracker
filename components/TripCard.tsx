'use client'

import Link from 'next/link'
import { CountdownTimer } from './CountdownTimer'
import { TripWithMembers } from '@/lib/supabase'

interface TripCardProps {
  trip: TripWithMembers
  isAdmin?: boolean
}

export function TripCard({ trip, isAdmin = false }: TripCardProps) {
  const totalSavings = trip.members.reduce((sum, member) => sum + member.current_savings, 0)
  const totalTarget = trip.target_amount * trip.members.length
  const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0
  const completedMembers = trip.members.filter(
    m => m.current_savings >= trip.target_amount
  ).length

  // Travel-themed gradient based on progress
  const getGradient = () => {
    if (overallProgress >= 100) return 'from-emerald-400 via-teal-400 to-cyan-400'
    if (overallProgress >= 75) return 'from-sky-400 via-blue-400 to-cyan-400'
    if (overallProgress >= 50) return 'from-amber-400 via-orange-400 to-yellow-400'
    return 'from-rose-300 via-pink-300 to-orange-300'
  }

  return (
    <Link href={`/trips/${trip.id}`} className="group block">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel hover:shadow-travel-lg transition-all duration-300 overflow-hidden border border-slate-200/50 dark:border-slate-700/50 h-full flex flex-col">
        {/* Travel destination header */}
        <div className={`h-24 bg-gradient-to-br ${getGradient()} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/5 dark:bg-black/20" />
          <div className="absolute top-4 left-5 right-5">
            <h3 className="text-xl font-bold text-white drop-shadow-lg mb-1 line-clamp-1">
              {trip.name}
            </h3>
            {trip.description && (
              <p className="text-sm text-white/90 drop-shadow line-clamp-1">
                {trip.description}
              </p>
            )}
          </div>
          {/* Destination marker icon */}
          <div className="absolute bottom-3 right-5">
            <svg className="w-6 h-6 text-white/80 drop-shadow" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          {/* Countdown Timer - Prominent */}
          <div className="mb-5">
            <CountdownTimer targetDate={trip.target_date} />
          </div>

          {/* Overall progress */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Journey Progress
              </span>
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {overallProgress.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getGradient()} rounded-full transition-all duration-500 ease-out relative`}
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
              </div>
            </div>
          </div>

          {/* Financial stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-auto">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saved</p>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                ${totalSavings.toFixed(0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Target</p>
              <p className="text-base font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                ${totalTarget.toFixed(0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ready</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {completedMembers}/{trip.members.length}
              </p>
            </div>
          </div>
        </div>

        {/* Hover indicator */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between text-sm text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="font-medium">View Journey →</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

