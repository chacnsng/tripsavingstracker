import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a function to get the supabase client
// This allows us to handle missing env vars gracefully during build
function createSupabaseClient(): SupabaseClient {
  // During build time (when env vars might not be available), use placeholders
  // At runtime, the actual env vars will be used
  const url = supabaseUrl || 'https://placeholder.supabase.co'
  const key = supabaseAnonKey || 'placeholder-key'
  
  const client = createClient(url, key)
  
  // Only validate at runtime (client-side)
  if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
    console.error('Missing Supabase environment variables')
    // Don't throw during build, but log error at runtime
  }
  
  return client
}

export const supabase = createSupabaseClient()

// Database types
export type User = {
  id: string
  name: string
  email?: string
  role: 'admin' | 'joiner'
  avatar_color?: string
  photo_url?: string
  owner_id?: string
  created_at: string
  updated_at: string
}

export type Trip = {
  id: string
  name: string
  description?: string
  target_date: string
  target_amount: number
  created_by?: string
  place_description?: string
  location?: string
  photos?: string[]
  created_at: string
  updated_at: string
}

export type TripMember = {
  id: string
  trip_id: string
  user_id: string
  current_savings: number
  created_at: string
  updated_at: string
}

export type SavingsLog = {
  id: string
  trip_id: string
  user_id: string
  old_amount: number | null
  new_amount: number | null
  admin_id: string
  created_at: string
}

export type TripMemberWithUser = TripMember & {
  user: User
}

export type TripWithMembers = Trip & {
  members: TripMemberWithUser[]
}

export type TripShareLink = {
  id: string
  trip_id: string
  share_token: string
  created_by?: string
  created_at: string
  updated_at: string
}

