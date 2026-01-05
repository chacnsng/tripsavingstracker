import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export type User = {
  id: string
  name: string
  email?: string
  role: 'admin' | 'joiner'
  avatar_color?: string
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

