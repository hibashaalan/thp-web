import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './LogoutButton'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/login')
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Protected Page</h1>
      <p>✅ You are signed in.</p>
      <p><strong>Email:</strong> {data.user.email}</p>
      <LogoutButton />
    </div>
  )
}