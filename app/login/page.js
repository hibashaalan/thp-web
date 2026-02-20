'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Login</h1>
      <p>You must sign in to view the protected page.</p>
      <button onClick={signInWithGoogle}>Sign in with Google</button>
    </div>
  )
}