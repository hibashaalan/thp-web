'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function Nav() {
  const [user, setUser] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <nav style={{
      borderBottom: '1px solid var(--border)',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 60,
      position: 'sticky',
      top: 0,
      background: 'var(--bg)',
      zIndex: 100,
    }}>
      <Link href="/list" style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: 'var(--accent)', letterSpacing: '-0.5px' }}>
        AlmostCrackd
      </Link>
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <Link href="/list" style={{ color: 'var(--text-muted)', fontSize: 14 }}>Browse</Link>
        {user && <Link href="/upload" style={{ color: 'var(--text-muted)', fontSize: 14 }}>Upload</Link>}
        {user ? (
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 14px',
              fontSize: 13,
            }}
          >
            Sign out
          </button>
        ) : (
          <Link href="/login" style={{
            background: 'var(--accent)',
            color: '#000',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 14px',
            fontSize: 13,
            fontWeight: 500,
          }}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}