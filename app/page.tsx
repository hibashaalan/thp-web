'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Nav from '@/app/components/Nav'

const SAMPLE_CAPTIONS = [
  "When you finally find the WiFi password at a party",
  "Monday morning energy, professionally packaged",
  "This is my 'I definitely read the terms and conditions' face",
  "Me explaining my 5-year plan to my cat at 2am",
  "Corporate said we have to look excited about the new KPIs",
  "When the group chat finally responds after 3 days",
]

export default function LandingPage() {
  const [captionIdx, setCaptionIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCaptionIdx(i => (i + 1) % SAMPLE_CAPTIONS.length)
        setFade(true)
      }, 350)
    }, 3200)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      <Nav />
      <main style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem 1.5rem',
        background: 'var(--bg)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '8%', left: '5%',
          width: 340, height: 340, borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
          background: 'radial-gradient(circle, rgba(196,146,42,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'blobFloat 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '6%',
          width: 280, height: 280, borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%',
          background: 'radial-gradient(circle, rgba(196,146,42,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'blobFloat 10s ease-in-out infinite reverse',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 100,
          padding: '6px 16px',
          fontSize: 12, fontWeight: 600,
          color: 'var(--accent)',
          marginBottom: 28,
          letterSpacing: '0.04em',
          animation: 'fadeUp 0.5s ease both',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', animation: 'pulse 2s ease infinite' }} />
          AI-POWERED CAPTION BATTLES
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(3.5rem, 10vw, 7.5rem)',
          fontWeight: 700,
          lineHeight: 1.0,
          letterSpacing: '-0.04em',
          color: 'var(--text)',
          marginBottom: 20,
          maxWidth: 800,
          animation: 'fadeUp 0.5s ease 0.1s both',
        }}>
          Almost
          <span style={{ color: 'var(--accent)', fontStyle: 'italic', position: 'relative', display: 'inline-block' }}>
            Crackd
            <svg style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 8, overflow: 'visible' }} viewBox="0 0 100 8" preserveAspectRatio="none">
              <path d="M0,6 Q25,0 50,5 Q75,10 100,4" stroke="var(--accent)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: 'var(--text-muted)',
          maxWidth: 460,
          lineHeight: 1.7,
          marginBottom: 40,
          animation: 'fadeUp 0.5s ease 0.2s both',
        }}>
          Upload any image. AI generates unhinged captions. You vote on the ones that make you lose it.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
          animation: 'fadeUp 0.5s ease 0.3s both',
        }}>
          <Link href="/list" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--text)', color: 'var(--bg)',
            padding: '14px 28px', borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
          >
            Start Voting
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <Link href="/upload" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--surface)', color: 'var(--text)',
            border: '1.5px solid var(--border)',
            padding: '14px 28px', borderRadius: 12,
            fontSize: 15, fontWeight: 600,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            Upload an Image
          </Link>
        </div>
      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blobFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -15px) scale(1.05); }
          66% { transform: translate(-10px, 10px) scale(0.97); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>
    </>
  )
}