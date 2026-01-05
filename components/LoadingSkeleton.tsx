'use client'

export function TripCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel overflow-hidden animate-pulse">
      <div className="h-32 bg-gradient-to-br from-sky-200 to-teal-200 dark:from-sky-900 dark:to-teal-900" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
          <div className="h-12 bg-gray-200 dark:bg-slate-700 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ProgressSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-20 bg-white dark:bg-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-32" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-12" />
        </div>
        <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded-full" />
      </div>
    </div>
  )
}

