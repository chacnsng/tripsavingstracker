'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, TripWithMembers, SavingsLog } from '@/lib/supabase'
import { ProgressAvatar } from '@/components/ProgressAvatar'
import { CountdownTimer } from '@/components/CountdownTimer'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import Link from 'next/link'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<TripWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [savingsLogs, setSavingsLogs] = useState<SavingsLog[]>([])
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

  useEffect(() => {
    if (params.id) {
      loadTrip()
    }
  }, [params.id])

  const loadTrip = async () => {
    try {
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          trip_members (
            *,
            user:users (*)
          )
        `)
        .eq('id', params.id)
        .single()

      if (tripError) throw tripError

      const tripWithMembers: TripWithMembers = {
        ...tripData,
        members: (tripData.trip_members || []).map((tm: any) => ({
          ...tm,
          user: tm.user,
        })),
      }

      setTrip(tripWithMembers)

      // Check if user is admin
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .limit(1)

      if (users && users.length > 0) {
        setIsAdmin(users[0].role === 'admin')
      }

      // Load savings logs
      const { data: logs, error: logsError } = await supabase
        .from('savings_log')
        .select('*')
        .eq('trip_id', params.id)
        .order('created_at', { ascending: false })

      if (!logsError && logs) {
        setSavingsLogs(logs)
      }
    } catch (error) {
      console.error('Error loading trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSavings = (memberId: string) => {
    setEditingMember(memberId)
    setEditAmount('')
  }

  const handleSaveSavings = async (memberId: string, userId: string) => {
    if (!trip || !isAdmin) return

    const amountToAdd = parseFloat(editAmount)
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      alert('Please enter a valid amount to add (must be greater than 0)')
      return
    }

    try {
      // Fetch current amount directly from database to ensure accuracy
      const { data: currentMember, error: fetchError } = await supabase
        .from('trip_members')
        .select('current_savings')
        .eq('id', memberId)
        .single()

      if (fetchError) throw fetchError

      const oldAmount = currentMember?.current_savings || 0
      const newAmount = oldAmount + amountToAdd

      // Update trip member
      const { error: updateError } = await supabase
        .from('trip_members')
        .update({ current_savings: newAmount })
        .eq('id', memberId)

      if (updateError) throw updateError

      // Log the change
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      if (adminUser) {
        const { error: logError } = await supabase.from('savings_log').insert({
          trip_id: trip.id,
          user_id: userId,
          old_amount: oldAmount,
          new_amount: newAmount,
          admin_id: adminUser.id,
        })

        if (logError) {
          console.error('Error logging savings change:', logError)
        }
      }

      setEditingMember(null)
      setEditAmount('')
      loadTrip()
    } catch (error: any) {
      console.error('Error updating savings:', error)
      alert(`Failed to add savings: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleCancelEdit = () => {
    setEditingMember(null)
    setEditAmount('')
  }

  const exportToCSV = () => {
    if (!trip) return

    const headers = ['User Name', 'Target Amount', 'Current Savings', 'Completion %', 'Last Updated']
    const rows = trip.members.map(member => {
      const progress = (member.current_savings / trip.target_amount) * 100
      return [
        member.user.name,
        trip.target_amount.toFixed(2),
        member.current_savings.toFixed(2),
        progress.toFixed(2) + '%',
        new Date(member.updated_at).toLocaleString(),
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trip.name.replace(/\s+/g, '_')}_savings.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-6">
            <div className="h-32 bg-white dark:bg-slate-800 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Trip not found</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">This trip doesn't exist or has been removed.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const totalSavings = trip.members.reduce((sum, member) => sum + member.current_savings, 0)
  const totalTarget = trip.target_amount * trip.members.length
  const overallProgress = totalTarget > 0 ? (totalSavings / totalTarget) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {trip.name}
                </h1>
                {trip.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    {trip.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              )}
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Countdown */}
        <div className="bg-gradient-to-br from-sky-500 via-blue-500 to-teal-500 rounded-2xl shadow-travel-lg p-8 mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90 mb-3">
                  Journey Status
                </h2>
                <CountdownTimer targetDate={trip.target_date} className="text-white" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-xs font-medium text-white/80 mb-1">Total Saved</p>
                  <p className="text-2xl font-bold tabular-nums">${totalSavings.toFixed(0)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-xs font-medium text-white/80 mb-1">Target</p>
                  <p className="text-2xl font-bold tabular-nums">${totalTarget.toFixed(0)}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30 col-span-2 md:col-span-1">
                  <p className="text-xs font-medium text-white/80 mb-1">Progress</p>
                  <p className="text-2xl font-bold tabular-nums">{overallProgress.toFixed(0)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Board - Progress Visualization */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel-lg p-8 mb-8 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Journey Board
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Track each traveler's progress toward the destination
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>0-50%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>50-75%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-sky-500" />
                <span>75-100%</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>100%</span>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            {trip.members.map(member => {
              const progress = (member.current_savings / trip.target_amount) * 100
              const hasReachedGoal = member.current_savings >= trip.target_amount

              return (
                <div
                  key={member.id}
                  className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700"
                >
                  <ProgressAvatar
                    user={member.user}
                    progress={Math.min(progress, 100)}
                    currentSavings={member.current_savings}
                    targetAmount={trip.target_amount}
                    hasReachedGoal={hasReachedGoal}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Savings Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel-lg p-6 border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Savings Details
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Financial breakdown for each traveler
              </p>
            </div>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                  <th className="text-left py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Traveler
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Saved
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Progress
                  </th>
                  {isAdmin && (
                    <th className="text-center py-4 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {trip.members.map(member => {
                  const progress = (member.current_savings / trip.target_amount) * 100
                  const isEditing = editingMember === member.id

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-slate-200 dark:ring-slate-700"
                            style={{
                              backgroundColor: member.user.avatar_color || '#0ea5e9',
                            }}
                          >
                            {member.user.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {member.user.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right py-4 px-4">
                        <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          ${trip.target_amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4">
                        {isEditing ? (
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Current: <span className="tabular-nums">${member.current_savings.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">+</span>
                              <input
                                type="number"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                className="w-28 px-3 py-2 border-2 border-sky-300 dark:border-sky-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                autoFocus
                              />
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              New total: <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">${(member.current_savings + (parseFloat(editAmount) || 0)).toFixed(2)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums text-lg">
                            ${member.current_savings.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="text-right py-4 px-4">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                progress >= 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                  : progress >= 75
                                  ? 'bg-gradient-to-r from-sky-500 to-blue-500'
                                  : progress >= 50
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                  : 'bg-gradient-to-r from-rose-500 to-pink-500'
                              }`}
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 w-14 text-right tabular-nums">
                            {progress.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="text-center py-4 px-4">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveSavings(member.id, member.user_id)}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                              >
                                Add
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddSavings(member.id)}
                              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                            >
                              Add Amount
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Savings History (Admin only) */}
        {isAdmin && savingsLogs.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel-lg p-6 mt-8 border border-slate-200/50 dark:border-slate-700/50">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                Savings History
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Complete audit trail of all savings updates
              </p>
            </div>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Traveler
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Previous
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {savingsLogs.slice(0, 20).map(log => {
                    const member = trip.members.find(m => m.user_id === log.user_id)
                    const change = (log.new_amount || 0) - (log.old_amount || 0)

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {member?.user.avatar_color && (
                              <div
                                className="w-6 h-6 rounded-full"
                                style={{ backgroundColor: member.user.avatar_color }}
                              />
                            )}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {member?.user.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
                            ${(log.old_amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            ${(log.new_amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="text-right py-3 px-4">
                          <span
                            className={`font-bold tabular-nums ${
                              change >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {change >= 0 ? '+' : ''}${change.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

