'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, TripWithMembers } from '@/lib/supabase'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import Link from 'next/link'

export default function TripPhotosPage() {
  const params = useParams()
  const router = useRouter()
  const [trip, setTrip] = useState<TripWithMembers | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

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

      // Parse photos if it's a string (JSON) or JSONB
      let photos: string[] = []
      if (tripData.photos) {
        if (typeof tripData.photos === 'string') {
          try {
            photos = JSON.parse(tripData.photos)
          } catch {
            photos = []
          }
        } else if (Array.isArray(tripData.photos)) {
          photos = tripData.photos
        } else if (typeof tripData.photos === 'object') {
          photos = Array.isArray(tripData.photos) ? tripData.photos : []
        }
      }

      const tripWithMembers: TripWithMembers = {
        ...tripData,
        photos: photos || [],
        place_description: tripData.place_description || undefined,
        location: tripData.location || undefined,
        members: (tripData.trip_members || []).map((tm: any) => ({
          ...tm,
          user: tm.user,
        })),
      }

      setTrip(tripWithMembers)
    } catch (error) {
      console.error('Error loading trip:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Trip not found</p>
          <Link
            href="/dashboard"
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href={`/trips/${trip.id}`}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Back to trip"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {trip.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Destination Gallery
                </p>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Location and Description Section */}
        {(trip.location || trip.place_description) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel-lg p-8 mb-8 border border-slate-200/50 dark:border-slate-700/50">
            {trip.location && (
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-sky-100 to-teal-100 dark:from-sky-900 dark:to-teal-900 rounded-xl">
                  <svg className="w-6 h-6 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Location
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {trip.location}
                  </h2>
                </div>
              </div>
            )}

            {trip.place_description && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 rounded-lg">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    About This Destination
                  </p>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed pl-12">
                  {trip.place_description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Images Gallery */}
        {trip.photos && trip.photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trip.photos.map((photo, index) => (
              <div
                key={index}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-travel hover:shadow-travel-lg transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedImage(photo)}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={photo}
                    alt={`${trip.name} - Image ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="800"%3E%3Crect fill="%23ddd" width="800" height="800"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="24"%3EImage not found%3C/text%3E%3C/svg%3E'
                    }}
                  />
                </div>
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel-lg p-12 text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Photos Yet</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Photos will appear here once they're added to this trip.
            </p>
          </div>
        )}
      </main>

      {/* Full Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

