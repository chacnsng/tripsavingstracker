'use client'

import { useEffect, useState } from 'react'
import { supabase, User, Trip } from '@/lib/supabase'
import { DarkModeToggle } from '@/components/DarkModeToggle'
import Link from 'next/link'

export default function AdminPage() {
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
  })

  // User form state
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'joiner' as 'admin' | 'joiner',
    avatar_color: '#0ea5e9',
  })

  // Trip members management
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [tripMembers, setTripMembers] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, tripsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*').order('target_date', { ascending: true }),
      ])

      if (usersRes.data) setUsers(usersRes.data)
      if (tripsRes.data) setTrips(tripsRes.data)
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

      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single()

      const { error } = await supabase.from('trips').insert({
        name: tripForm.name.trim(),
        description: tripForm.description?.trim() || null,
        target_date: tripForm.target_date,
        target_amount: parseFloat(tripForm.target_amount),
        created_by: adminUser?.id || null,
      })

      if (error) {
        console.error('Supabase error:', error)
        alert(`Failed to create trip: ${error.message || JSON.stringify(error)}`)
        return
      }

      setShowTripForm(false)
      setTripForm({ name: '', description: '', target_date: '', target_amount: '' })
      loadData()
    } catch (error: any) {
      console.error('Error creating trip:', error)
      alert(`Failed to create trip: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleUpdateTrip = async () => {
    if (!editingTrip) return

    try {
      const { error } = await supabase
        .from('trips')
        .update({
          name: tripForm.name,
          description: tripForm.description || null,
          target_date: tripForm.target_date,
          target_amount: parseFloat(tripForm.target_amount),
        })
        .eq('id', editingTrip.id)

      if (error) throw error

      setEditingTrip(null)
      setShowTripForm(false)
      setTripForm({ name: '', description: '', target_date: '', target_amount: '' })
      loadData()
    } catch (error) {
      console.error('Error updating trip:', error)
      alert('Failed to update trip')
    }
  }

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase.from('trips').delete().eq('id', tripId)
      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting trip:', error)
      alert('Failed to delete trip')
    }
  }

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    setTripForm({
      name: trip.name,
      description: trip.description || '',
      target_date: trip.target_date,
      target_amount: trip.target_amount.toString(),
    })
    setShowTripForm(true)
  }

  const handleCreateUser = async () => {
    try {
      if (!userForm.name.trim()) {
        alert('Please enter a name')
        return
      }

      const { error } = await supabase.from('users').insert({
        name: userForm.name.trim(),
        email: userForm.email?.trim() || null,
        role: userForm.role,
        avatar_color: userForm.avatar_color,
      })

      if (error) {
        console.error('Supabase error:', error)
        alert(`Failed to create user: ${error.message || JSON.stringify(error)}`)
        return
      }

      setShowUserForm(false)
      setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9' })
      loadData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      alert(`Failed to create user: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: userForm.name,
          email: userForm.email || null,
          role: userForm.role,
          avatar_color: userForm.avatar_color,
        })
        .eq('id', editingUser.id)

      if (error) throw error

      setEditingUser(null)
      setShowUserForm(false)
      setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9' })
      loadData()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', userId)
      if (error) throw error
      loadData()
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
    })
    setShowUserForm(true)
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage trips, users, and savings
                </p>
              </div>
            </div>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'trips'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Trips
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Trips</h2>
              <button
                onClick={() => {
                  setEditingTrip(null)
                  setTripForm({ name: '', description: '', target_date: '', target_amount: '' })
                  setShowTripForm(true)
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                + Create Trip
              </button>
            </div>

            {trips.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No trips yet. Create your first trip!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map(trip => (
                  <div
                    key={trip.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {trip.name}
                    </h3>
                    {trip.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {trip.description}
                      </p>
                    )}
                    <div className="space-y-1 text-sm mb-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        Target: ${trip.target_amount.toFixed(2)} per person
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Date: {new Date(trip.target_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 text-center text-sm transition-colors"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleManageMembers(trip)}
                        className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm transition-colors"
                      >
                        Members
                      </button>
                      <button
                        onClick={() => handleEditTrip(trip)}
                        className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTrip(trip.id)}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
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
                  setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9' })
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingTrip ? 'Edit Trip' : 'Create Trip'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trip Name *
                  </label>
                  <input
                    type="text"
                    value={tripForm.name}
                    onChange={e => setTripForm({ ...tripForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Summer Vacation 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={tripForm.description}
                    onChange={e => setTripForm({ ...tripForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                    placeholder="Optional description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Date *
                  </label>
                  <input
                    type="date"
                    value={tripForm.target_date}
                    onChange={e => setTripForm({ ...tripForm, target_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Amount per Person *
                  </label>
                  <input
                    type="number"
                    value={tripForm.target_amount}
                    onChange={e => setTripForm({ ...tripForm, target_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="1000.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingTrip ? handleUpdateTrip : handleCreateTrip}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingTrip ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowTripForm(false)
                      setEditingTrip(null)
                      setTripForm({ name: '', description: '', target_date: '', target_amount: '' })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingUser ? 'Edit User' : 'Create User'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role *
                  </label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'joiner' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="joiner">Joiner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Avatar Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={userForm.avatar_color}
                      onChange={e => setUserForm({ ...userForm, avatar_color: e.target.value })}
                      className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={userForm.avatar_color}
                      onChange={e => setUserForm({ ...userForm, avatar_color: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="#0ea5e9"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowUserForm(false)
                      setEditingUser(null)
                      setUserForm({ name: '', email: '', role: 'joiner', avatar_color: '#0ea5e9' })
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Members Modal */}
        {selectedTrip && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Manage Members: {selectedTrip.name}
                </h3>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Member
                </label>
                <div className="flex gap-2">
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddMember(e.target.value)
                        e.target.value = ''
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a user...</option>
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
              </div>

              <div className="space-y-2">
                {tripMembers.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                    No members yet. Add members above.
                  </p>
                ) : (
                  tripMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
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
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {member.user.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${member.current_savings.toFixed(2)} saved
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

