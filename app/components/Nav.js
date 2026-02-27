'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const [user, setUser] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null))
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 64,
      position: 'sticky',
      top: 0,
      background: scrolled ? 'rgba(245, 240, 232, 0.92)' : 'var(--bg)',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      zIndex: 100,
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <Link href="/list" style={{
        fontFamily: 'Fraunces, serif',
        fontSize: 22,
        fontWeight: 600,
        color: 'var(--text)',
        letterSpacing: '-0.03em',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        opacity: 1,
      }}>
        <span style={{
          display: 'inline-flex',
          width: 32,
          height: 32,
          background: 'var(--accent)',
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          transition: 'transform 0.3s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'rotate(-8deg) scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'rotate(0deg) scale(1)'}
        >
          😂
        </span>
        <span>AlmostCrackd</span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <NavLink href="/list" active={pathname === '/list'}>Browse</NavLink>
        {user && <NavLink href="/upload" active={pathname === '/upload'}>Upload</NavLink>}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-pale)',
              border: '2px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              overflow: 'hidden',
            }}>
              {user.user_metadata?.avatar_url
                ? <img src={user.user_metadata.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.email?.[0]?.toUpperCase()
              }
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              style={{
                background: 'transparent',
                border: '1.5px solid var(--border)',
                color: 'var(--text-muted)',
                borderRadius: 8,
                padding: '5px 12px',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <Link href="/login" style={{
            background: 'var(--text)',
            color: 'var(--bg)',
            borderRadius: 8,
            padding: '7px 16px',
            fontSize: 13,
            fontWeight: 600,
            marginLeft: 8,
            display: 'inline-block',
            transition: 'all 0.15s',
            opacity: 1,
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}

function NavLink({ href, active, children }) {
  const [hover, setHover] = useState(false)
  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        color: active ? 'var(--text)' : hover ? 'var(--text)' : 'var(--text-muted)',
        fontSize: 14,
        fontWeight: active ? 600 : 500,
        padding: '6px 12px',
        borderRadius: 8,
        background: active ? 'var(--surface2)' : hover ? 'var(--surface2)' : 'transparent',
        transition: 'all 0.15s',
        textDecoration: 'none',
        opacity: 1,
      }}
    >
      {children}
    </Link>
  )
}