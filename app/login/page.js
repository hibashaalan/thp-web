'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const [hover, setHover] = useState(false)

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg)',
    }}>
      {/* Left decorative panel */}
      <div style={{
        display: 'none',
        flex: '0 0 42%',
        background: 'var(--text)',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: '4rem',
      }}
        className="login-panel"
      >
        <div style={{ textAlign: 'center', color: 'var(--bg)' }}>
          <div style={{ fontSize: 72, marginBottom: 24, animation: 'float 3s ease infinite' }}>😂</div>
          <p style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(1.4rem, 3vw, 2rem)',
            fontStyle: 'italic',
            lineHeight: 1.4,
            opacity: 0.9,
            maxWidth: 280,
          }}>
            "Caption the uncaptionable."
          </p>
        </div>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', bottom: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          border: '2px solid rgba(245,240,232,0.1)',
        }} />
        <div style={{
          position: 'absolute', top: -40, left: -40,
          width: 180, height: 180, borderRadius: '50%',
          border: '2px solid rgba(245,240,232,0.08)',
        }} />
      </div>

      {/* Right sign-in panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
      }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.5s ease both' }}>
          {/* Logo */}
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              width: 56, height: 56,
              background: 'var(--accent)',
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              marginBottom: 20,
              boxShadow: '0 4px 20px rgba(196,146,42,0.3)',
            }}>
              😂
            </div>
            <h1 style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 'clamp(2rem, 5vw, 2.8rem)',
              color: 'var(--text)',
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              marginBottom: 10,
            }}>
              AlmostCrackd
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Vote on AI-generated captions for wild images
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 20,
            padding: '2.5rem',
            boxShadow: 'var(--shadow)',
          }}>
            <h2 style={{
              fontSize: 20,
              marginBottom: 6,
              fontFamily: 'Fraunces, serif',
              color: 'var(--text)',
            }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 28 }}>
              Sign in to vote and upload your own images
            </p>

            <button
              onClick={signInWithGoogle}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: hover ? '#111' : 'var(--text)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                transition: 'all 0.2s',
                transform: hover ? 'translateY(-1px)' : 'none',
                boxShadow: hover ? '0 6px 24px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              margin: '20px 0',
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            <a href="/list" style={{
              display: 'block',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: 13,
              padding: '10px',
              borderRadius: 8,
              border: '1.5px solid var(--border)',
              transition: 'all 0.15s',
              opacity: 1,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
            >
              Browse without signing in →
            </a>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 24, opacity: 0.7 }}>
            By signing in you agree to our terms of use
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .login-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}