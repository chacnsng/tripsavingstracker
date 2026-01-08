'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, User, Trip } from '@/lib/supabase'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import { PhotoUpload } from '@/components/PhotoUpload'
import { uploadUserPhoto, deleteUserPhoto } from '@/lib/storage'
import Link from 'next/link'

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'trips' | 'users'>('trips')

  // Trip form state
  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null)
  const [tripForm, setTripForm] = useState({
    name: '',
    description: '',
    target_date: '',
    target_amount: '',
    place_description: '',
    location: '',
    photos: [] as string[],
  })
  const [photoInput, setPhotoInput] = useState('')

  // User form state
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'joiner' as 'admin' | 'joiner',
    avatar_color: '#0ea5e9',
    photo_url: '',
  })
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)

  // Trip members management
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [tripMembers, setTripMembers] = useState<any[]>([])

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      // Not authenticated, redirect to login
      router.push('/auth/login')
      return
    }
    
    // User is authenticated, load data
    loadData(session.user.id)
  }

  useEffect(() => {
    const handlePhotoFileSelect = (e: Event) => {
      const customEvent = e as CustomEvent<File>
      setPendingPhotoFile(customEvent.detail)
    }

    window.addEventListener('photoFileSelected', handlePhotoFileSelect as EventListener)
    return () => {
      window.removeEventListener('photoFileSelected', handlePhotoFileSelect as EventListener)
    }
  }, [])

  const loadData = async (authUserId?: string) => {
    try {
      // Get auth user ID if not provided
      if (!authUserId) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }
        authUserId = session.user.id
      }

      // Get current user profile
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUserId)
        .single()

      if (!currentUser) {
        console.error('User profile not found')
        setLoading(false)
        return
      }

      // Load only trips created by the current user
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('*')
        .eq('created_by', currentUser.id)
        .order('target_date', { ascending: true })

      if (tripsError) throw tripsError
      if (tripsData) setTrips(tripsData)

      // Load users - only show users created by the current account owner
      const { data: allUsers } = await supabase
        .from('users')
        .select('*')
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false })

      if (allUsers) {
        // Show only users owned by the current account
        setUsers(allUsers)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTrip = async () => {
    try {
      if (!tripForm.name.trim()) {
        alert('Please enter a trip name')
        return
      }
      if (!tripForm.target_date) {
        alert('Please select a target date')
        return
      }
      if (!tripForm.target_amount || parseFloat(tripForm.target_amount) <= 0) {
        alert('Please enter a valid target amount')
        return
      }

      // Get current authenticated user
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('You must be logged in to create trips')
        return
      }

      // Get user profile
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      // Ensure photos is properly formatted as JSONB
      const photosData = tripForm.photos.length > 0 ? tripForm.photos : null

      const { error } = await supabase.from('trips').insert({
        name: tripForm.name.trim(),
        description: tripForm.description?.trim() || null,
        target_date: tripForm.target_date,
        target_amount: parseFloat(tripForm.target_amount),
        place_description: tripForm.place_description?.trim() || null,
        location: tripForm.location?.trim() || null,
        photos: photosData,
        created_by: adminUser?.id || null,
      })

      if (error) {
        console.error('Supabase error:', error)
        alert(`Failed to create trip: ${error.message || JSON.stringify(error)}`)
        return
      }

      setShowTripForm(false)
      setTripForm({ name: '', description: '', target_date: '', target_amount: '', place_description: '', location: '', photos: [] })
      if (session) loadData(session.user.id)
    } catch (error: any) {
      console.error('Error creating trip:', error)
      alert(`Failed to create trip: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleUpdateTrip = async () => {
    if (!editingTrip) return

    try {
      if (!tripForm.name.trim()) {
        alert('Please enter a trip name')
        return
      }
      if (!tripForm.target_date) {
        alert('Please select a target date')
        return
      }
      if (!tripForm.target_amount || parseFloat(tripForm.target_amount) <= 0) {
        alert('Please enter a valid target amount')
        return
      }

      // Ensure photos is properly formatted as JSONB
      const photosData = tripForm.photos.length > 0 ? tripForm.photos : null

      const { error } = await supabase
        .from('trips')
        .update({
          name: tripForm.name.trim(),
          description: tripForm.description?.trim() || null,
          target_date: tripForm.target_date,
          target_amount: parseFloat(tripForm.target_amount),
          place_description: tripForm.place_description?.trim() || null,
          location: tripForm.location?.trim() || null,
          photos: photosData,
        })
        .eq('id', editingTrip.id)

      if (error) {
        console.error('Supabase error:', error)
        alert(`Failed to update trip: ${error.message || JSON.stringify(error)}`)
        return
      }

      setEditingTrip(null)
      setShowTripForm(false)
      setTripForm({ name: '', description: '', target_date: '', target_amount: '', place_description: '', location: '', photos: [] })
      setPhotoInput('')
      const { data: { session } } = await supabase.auth.getSession()
      if (session) loadData(session.user.id)
    } catch (error: any) {
      console.error('Error updating trip:', error)
      alert(`Failed to update trip: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase.from('trips').delete().eq('id', tripId)
      if (error) throw error
      const { data: { session } } = await supabase.auth.getSession()
      if (session) loadData(session.user.id)
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip')
    }
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    let photos: string[] = []
    if (trip.photos) {
      if (Array.isArray(trip.photos)) {
        photos = trip.photos
      } else if (typeof trip.photos === 'string') {
        try {
          photos = JSON.parse(trip.photos)
        } catch {
          photos = []
        }
      }
    }
    setTripForm({
      name: trip.name,
      description: trip.description || '',
      target_date: trip.target_date,
      target_amount: trip.target_amount.toString(),
      place_description: trip.place_description || '',
      location: trip.location || '',
      photos: photos,
    })
    setPhotoInput('')
    setShowTripForm(true)
  }

  const handleAddPhoto = () => {
    const url = photoInput.trim()
    if (url && !tripForm.photos.includes(url)) {
      setTripForm({ ...tripForm, photos: [...tripForm.photos, url] })
      setPhotoInput('')
    }
  }

  const handleRemovePhoto = (index: number) => {
    setTripForm({
      ...tripForm,
      photos: tripForm.photos.filter((_, i) => i !== index),
    })
  }

  const handleCreateUser = async () => {
    try {
      if (!userForm.name.trim()) {
        alert('Please enter a name')
        return
      }

      // Check if email already exists (if email is provided)
      if (userForm.email?.trim()) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', userForm.email.trim())
          .single()

        if (existingUser) {
          alert('A user with this email already exists. Please use a different email or leave it empty.')
          return
        }
      }

      // Get current user to set as owner
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        alert('You must be logged in to create users')
        return
      }

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single()

      if (!currentUser) {
        alert('User profile not found')
        return
      }

      // First create the user to get the user ID
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          name: userForm.name.trim(),
          email: userForm.email?.trim() || null,
          role: userForm.role,
          avatar_color: userForm.avatar_color,
          photo_url: userForm.photo_url?.trim() || null,
          owner_id: currentUser.id, // Set the current user as the owner
        })
        .select()
        .single()

      if (createError) {
        console.error('Supabase error:', createError)
        let errorMessage = createError.message || 'Unknown error'
        
        // Provide more helpful error messages
        if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
          errorMessage = 'A user with this email already exists. Please use a different email.'
        } else if (errorMessage.includes('violates row-level security')) {
          errorMessage = 'Permission denied. Please make sure you are logged in and have the correct permissions.'
        }
        
        alert(`Failed to create user: ${errorMessage}`)
        return
      }

      if (!newUser) {
        alert('Failed to create user: No user data returned')
        return
      }

      // If there's a pending photo file, upload it now that we have the user ID
      if (pendingPhotoFile && newUser) {
        try {
          const photoUrl = await uploadUserPhoto(pendingPhotoFile, newUser.id)
          if (photoUrl) {
            // Update the user with the photo URL
            await supabase
              .from('users')
              .update({ photo_url: photoUrl })
              .eq('id', newUser.id)
          }
        } catch (error) {
          console.error('Error uploading photo after user creation:', error)
          // Don't fail the user creation if photo upload fails
        }
        setPendingPhotoFile(null)
      }

      setShowUserForm(false)
      setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9', photo_url: '' })
      if (session) loadData(session.user.id)
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(`Failed to create user: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      if (!userForm.name.trim()) {
        alert('Please enter a name')
        return
      }

      // Handle photo URL - PhotoUpload component handles upload for existing users
      // For new users, pendingPhotoFile would be set, but for editing, photo_url is already set
      let photoUrl = userForm.photo_url
      
      // If there's a pending photo file (shouldn't happen when editing, but handle it)
      if (pendingPhotoFile) {
        // Delete old photo if it exists and is from our storage
        if (editingUser.photo_url && editingUser.photo_url.includes('supabase.co')) {
          try {
            await deleteUserPhoto(editingUser.photo_url)
          } catch (error) {
            console.error('Error deleting old photo:', error)
            // Continue even if deletion fails
          }
        }
        
        // Upload the new photo
        try {
          const uploadedUrl = await uploadUserPhoto(pendingPhotoFile, editingUser.id)
          if (uploadedUrl) {
            photoUrl = uploadedUrl
          } else {
            throw new Error('Photo upload returned no URL')
          }
        } catch (error: any) {
          console.error('Error uploading photo:', error)
          alert(`Failed to upload photo: ${error?.message || 'Unknown error'}`)
          return
        }
        setPendingPhotoFile(null)
      } else if (userForm.photo_url && userForm.photo_url !== editingUser.photo_url) {
        // Photo was uploaded via PhotoUpload component (photo_url changed)
        // Delete old photo if it exists and is from our storage
        if (editingUser.photo_url && editingUser.photo_url.includes('supabase.co')) {
          try {
            await deleteUserPhoto(editingUser.photo_url)
          } catch (error) {
            console.error('Error deleting old photo:', error)
            // Continue even if deletion fails
          }
        }
        photoUrl = userForm.photo_url
      }

      // Update the user
      const { error } = await supabase
        .from('users')
        .update({
          name: userForm.name.trim(),
          email: userForm.email?.trim() || null,
          role: userForm.role,
          avatar_color: userForm.avatar_color,
          photo_url: photoUrl?.trim() || null,
        })
        .eq('id', editingUser.id)

      if (error) {
        console.error('Supabase error:', error)
        alert(`Failed to update user: ${error.message || JSON.stringify(error)}`)
        return
      }

      setShowUserForm(false)
      setEditingUser(null)
      setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9', photo_url: '' })
      setPendingPhotoFile(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) loadData(session.user.id)
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(`Failed to update user: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) throw error
      const { data: { session } } = await supabase.auth.getSession()
      if (session) loadData(session.user.id)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setUserForm({
      name: user.name,
      email: user.email || '',
      role: user.role,
      avatar_color: user.avatar_color || '#0ea5e9',
      photo_url: user.photo_url || '',
    })
    setPendingPhotoFile(null)
    setShowUserForm(true)
  }

  const handlePhotoUpload = (photoUrl: string | null) => {
    if (photoUrl) {
      setUserForm({ ...userForm, photo_url: photoUrl })
    } else {
      setUserForm({ ...userForm, photo_url: '' })
    }
  }

  const handlePhotoFileSelect = (file: File) => {
    setPendingPhotoFile(file)
  }

  const loadTripMembers = async (tripId: string) => {
    try {
      const { data, error } = await supabase
        .from('trip_members')
        .select(`
          *,
          user:users (*)
        `)
        .eq('trip_id', tripId)

      if (error) throw error
      setTripMembers(data || [])
    } catch (error) {
      console.error('Error loading trip members:', error)
    }
  }

  const handleManageMembers = async (trip: Trip) => {
    setSelectedTrip(trip)
    await loadTripMembers(trip.id)
  }

  const handleAddMember = async (userId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase.from('trip_members').insert({
        trip_id: selectedTrip.id,
        user_id: userId,
        current_savings: 0,
      })

      if (error) throw error
      await loadTripMembers(selectedTrip.id)
    } catch (error) {
      console.error('Error adding member:', error)
      alert('Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTrip) return

    try {
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      await loadTripMembers(selectedTrip.id)
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Failed to remove member')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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
                href="/dashboard"
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                aria-label="Back to dashboard"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-teal-600 dark:from-sky-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Create Trip
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Manage trips, users, and savings
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/dashboard')
                }}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-colors text-sm"
              >
                Logout
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8 border-b-2 border-slate-200 dark:border-slate-700">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-4 px-1 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'trips'
                  ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Trips
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-1 font-semibold text-sm transition-all duration-200 ${
                activeTab === 'users'
                  ? 'text-sky-600 dark:text-sky-400 border-b-2 border-sky-600 dark:border-sky-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Users
            </button>
          </div>
        </div>

        {/* Trips Tab */}
        {activeTab === 'trips' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Trips</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {trips.length} {trips.length === 1 ? 'trip' : 'trips'} total
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingTrip(null)
                  setTripForm({ name: '', description: '', target_date: '', target_amount: '', place_description: '', location: '', photos: [] })
                  setPhotoInput('')
                  setShowTripForm(true)
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Trip
              </button>
            </div>

            {trips.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel-lg p-12 text-center border border-slate-200/50 dark:border-slate-700/50">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No trips yet</h3>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first trip to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trips.map(trip => (
                  <div
                    key={trip.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-travel hover:shadow-travel-lg transition-all duration-300 p-6 border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <h3 className="font-bold text-xl text-slate-900 dark:text-slate-100 mb-2">
                      {trip.name}
                    </h3>
                    {trip.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                        {trip.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm mb-5">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-semibold">${trip.target_amount.toFixed(2)}</span> per person
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{new Date(trip.target_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl text-center text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleManageMembers(trip)}
                        className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Members
                      </button>
                      <button
                        onClick={() => handleEditTrip(trip)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Users</h2>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9', photo_url: '' })
                  setShowUserForm(true)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                + Create User
              </button>
            </div>

            {users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No users yet. Create your first user!</p>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Avatar Color
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: user.avatar_color || '#0ea5e9' }}
                            >
                              {user.name
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {user.email || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
                            style={{ backgroundColor: user.avatar_color || '#0ea5e9' }}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm mr-2 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Trip Form Modal */}
        {showTripForm && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowTripForm(false)
                setEditingTrip(null)
                setTripForm({ name: '', description: '', target_date: '', target_amount: '', place_description: '', location: '', photos: [] })
                setPhotoInput('')
              }
            }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
              {/* Header - Sticky */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {editingTrip ? 'Edit Trip' : 'Create New Trip'}
                </h3>
                <button
                  onClick={() => {
                    setShowTripForm(false)
                    setEditingTrip(null)
                    setTripForm({ name: '', description: '', target_date: '', target_amount: '', place_description: '', location: '', photos: [] })
                    setPhotoInput('')
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Trip Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tripForm.name}
                      onChange={e => setTripForm({ ...tripForm, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="Summer Vacation 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={tripForm.description}
                      onChange={e => setTripForm({ ...tripForm, description: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      placeholder="Optional description..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Target Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={tripForm.target_date}
                        onChange={e => setTripForm({ ...tripForm, target_date: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Target Amount per Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={tripForm.target_amount}
                        onChange={e => setTripForm({ ...tripForm, target_amount: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        placeholder="1000.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={tripForm.location}
                      onChange={e => setTripForm({ ...tripForm, location: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="e.g., Paris, France"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Place Description
                    </label>
                    <textarea
                      value={tripForm.place_description}
                      onChange={e => setTripForm({ ...tripForm, place_description: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all resize-none"
                      rows={4}
                      placeholder="Describe the destination, what makes it special..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Photos (Image URLs)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="url"
                        value={photoInput}
                        onChange={e => setPhotoInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAddPhoto()}
                        className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        onClick={handleAddPhoto}
                        className="px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 text-sm"
                      >
                        Add
                      </button>
                    </div>
                    {tripForm.photos.length > 0 && (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {tripForm.photos.map((photo, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
                            <img 
                              src={photo} 
                              alt={`Photo ${index + 1}`} 
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0" 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }} 
                            />
                            <span className="flex-1 text-xs text-slate-600 dark:text-slate-400 truncate font-mono">{photo}</span>
                            <button
                              onClick={() => handleRemovePhoto(index)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                              aria-label="Remove photo"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Footer - Sticky */}
              <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowTripForm(false)
                    setEditingTrip(null)
                    setTripForm({ name: '', description: '', target_date: '', target_amount: '', place_description: '', location: '', photos: [] })
                    setPhotoInput('')
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingTrip ? handleUpdateTrip : handleCreateTrip}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {editingTrip ? 'Update Trip' : 'Create Trip'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowUserForm(false)
                setEditingUser(null)
                setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9', photo_url: '' })
              }
            }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
              {/* Header - Sticky */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h3>
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(null)
                    setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9', photo_url: '' })
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6">
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={userForm.role}
                      onChange={e => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'joiner' })}
                      className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                    >
                      <option value="joiner">Joiner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Profile Photo
                    </label>
                    <PhotoUpload
                      userId={editingUser?.id}
                      currentPhotoUrl={userForm.photo_url || undefined}
                      onUploadComplete={handlePhotoUpload}
                      onError={(error) => alert(error)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Avatar Color (fallback)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={userForm.avatar_color}
                        onChange={e => setUserForm({ ...userForm, avatar_color: e.target.value })}
                        className="w-20 h-12 border-2 border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={userForm.avatar_color}
                        onChange={e => setUserForm({ ...userForm, avatar_color: e.target.value })}
                        className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all font-mono"
                        placeholder="#0ea5e9"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Used if photo URL is not provided or fails to load
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Footer - Sticky */}
              <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(null)
                    setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9', photo_url: '' })
                  }}
                  className="flex-1 px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingUser ? handleUpdateUser : handleCreateUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-700 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trip Members Modal */}
        {selectedTrip && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedTrip(null)
              }
            }}
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
              {/* Header - Sticky */}
              <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Manage Members
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {selectedTrip.name}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    Add Member
                  </label>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddMember(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a user to add...</option>
                    {users
                      .filter(
                        u => !tripMembers.some(tm => tm.user_id === u.id)
                      )
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-3">
                  {tripMembers.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <svg className="w-12 h-12 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">
                        No members yet. Add members above.
                      </p>
                    </div>
                  ) : (
                    tripMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-slate-200 dark:ring-slate-700 overflow-hidden"
                            style={{
                              backgroundColor: member.user.avatar_color || '#0ea5e9',
                            }}
                          >
                            {member.user.photo_url ? (
                              <img
                                src={member.user.photo_url}
                                alt={member.user.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    const initials = member.user.name
                                      .split(' ')
                                      .map((n: string) => n[0])
                                      .join('')
                                      .toUpperCase()
                                      .slice(0, 2)
                                    parent.textContent = initials
                                  }
                                }}
                              />
                            ) : (
                              member.user.name
                                .split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {member.user.name}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              ${member.current_savings.toFixed(2)} saved
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

