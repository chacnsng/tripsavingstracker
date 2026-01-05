import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirect to dashboard
  // In production, add proper authentication check here
  redirect('/dashboard')
}

