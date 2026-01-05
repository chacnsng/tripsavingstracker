'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, TripWithMembers } from '@/lib/supabase'
import { TripCard } from '@/components/TripCard'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { TripCardSkeleton } from '@/components/LoadingSkeleton'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<TripWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        // Not authenticated, redirect to login
        router.push('/auth/login')
        return
      }

      // Get current user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .single()

      if (userProfile) {
        setCurrentUser(userProfile)
        setIsAdmin(userProfile.is_owner || userProfile.role === 'admin')
      } else {
        // User profile not found, redirect to login
        router.push('/auth/login')
        return
      }

      // Load only trips created by the current user
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select(`
          *,
          trip_members (
            *,
            user:users (*)
          )
        `)
        .eq('created_by', userProfile.id)
        .order('target_date', { ascending: true })

      if (tripsError) throw tripsError

      // Transform data
      const tripsWithMembers: TripWithMembers[] = (tripsData || []).map(trip => ({
        ...trip,
        members: (trip.trip_members || []).map((tm: any) => ({
          ...tm,
          user: tm.user,
        })),
      }))

      setTrips(tripsWithMembers)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-teal-600 dark:from-sky-400 dark:to-teal-400 bg-clip-text text-transparent">
                  TripTrack
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Your travel savings journeys
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {currentUser && (
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {currentUser.name}
                </span>
              )}
              <button
                onClick={async () => {
                  // Check if user is authenticated
                  const { data: { session } } = await supabase.auth.getSession()
                  
                  if (session) {
                    // User is authenticated, go to create trip page (admin panel)
                    router.push('/admin')
                  } else {
                    // User is not authenticated, redirect to login
                    router.push('/auth/login')
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
              >
                Create Trip
              </button>
              {currentUser && (
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    router.push('/auth/login')
                  }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-colors text-sm"
                >
                  Logout
                </button>
              )}
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {trips.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-100 to-teal-100 dark:from-sky-900 dark:to-teal-900 mb-6">
              <svg className="w-10 h-10 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              No adventures yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {isAdmin 
                ? 'Start planning your first group trip! Create a trip and invite your travel companions to begin tracking savings together.'
                : 'No trips have been created yet. Contact your admin to get started!'}
            </p>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Trip
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Your Travel Journeys
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                  {trips.length} {trips.length === 1 ? 'trip' : 'trips'} in progress
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map(trip => (
                <TripCard key={trip.id} trip={trip} isAdmin={isAdmin} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

