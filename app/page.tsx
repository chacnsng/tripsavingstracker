import { redirect } from 'next/navigation'
  
export default async function Home() {
  // Redirect to admin login
  redirect('/auth/login')
}

