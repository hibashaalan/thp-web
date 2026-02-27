'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Nav from '@/app/components/Nav'
import Link from 'next/link'

export default function ListPage() {
  const [captions, setCaptions] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [voteState, setVoteState] = useState(null) // 'up' | 'down' | null
  const [animating, setAnimating] = useState(null) // 'left' | 'right' | null
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('captions')
      .select('id, content, image_id, images(url)')
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCaptions(data || [])
        setLoading(false)
      })
  }, [])

  const current = captions[index]
  const isLast = index >= captions.length - 1

  const advance = useCallback((direction) => {
    setAnimating(direction)
    setTimeout(() => {
      setIndex(i => i + 1)
      setVoteState(null)
      setAnimating(null)
    }, 350)
  }, [])

  const vote = useCallback(async (value) => {
    if (saving || !current) return
    setVoteState(value === 1 ? 'up' : 'down')
    setSaving(true)

    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captionId: current.id, vote: value }),
      })
    } catch (_) {}

    setSaving(false)
    advance(value === 1 ? 'right' : 'left')
  }, [saving, current, advance])

  const skip = useCallback(() => {
    if (!current) return
    advance('left')
  }, [current, advance])

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') vote(1)
      if (e.key === 'ArrowLeft') vote(-1)
      if (e.key === 'ArrowDown') skip()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [vote, skip])

  return (
    <>
      <Nav />
      <main style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}>
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} />
        ) : captions.length === 0 ? (
          <EmptyState />
        ) : !current ? (
          <DoneState total={captions.length} />
        ) : (
          <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

            {/* Progress bar */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 3, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(index / captions.length) * 100}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {index + 1} / {captions.length}
              </span>
            </div>

            {/* Card */}
            <div
              key={current.id}
              style={{
                position: 'relative',
                width: '100%',
                background: 'var(--surface)',
                border: `2px solid ${
                  voteState === 'up' ? 'var(--accent)' :
                  voteState === 'down' ? 'var(--danger)' :
                  'var(--border)'
                }`,
                borderRadius: 20,
                overflow: 'hidden',
                boxShadow: voteState === 'up'
                  ? '0 0 40px rgba(232,197,71,0.15)'
                  : voteState === 'down'
                  ? '0 0 40px rgba(224,92,92,0.15)'
                  : '0 8px 40px rgba(0,0,0,0.4)',
                transform: animating === 'right'
                  ? 'translateX(120%) rotate(12deg)'
                  : animating === 'left'
                  ? 'translateX(-120%) rotate(-12deg)'
                  : 'translateX(0) rotate(0deg)',
                opacity: animating ? 0 : 1,
                transition: animating
                  ? 'transform 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease'
                  : 'border-color 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Vote stamp badges */}
              {voteState === 'up' && <VoteBadge label="FUNNY" color="var(--accent)" textColor="#000" side="right" />}
              {voteState === 'down' && <VoteBadge label="MEH" color="var(--danger)" textColor="#fff" side="left" />}

              {/* Image */}
              {current.images?.url && (
                <div style={{ position: 'relative', paddingBottom: '65%', overflow: 'hidden', background: 'var(--bg)' }}>
                  <img
                    src={current.images.url}
                    alt="caption image"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Caption */}
              <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
                <p style={{
                  fontFamily: 'Playfair Display, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
                  lineHeight: 1.55,
                  color: 'var(--text)',
                }}>
                  "{current.content}"
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <ActionButton onClick={() => vote(-1)} disabled={saving} color="var(--danger)" label="Meh" title="Meh (←)">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </ActionButton>

              <button
                onClick={skip}
                title="Skip"
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: '1px solid var(--border)', background: 'var(--surface2)',
                  color: 'var(--text-muted)', fontSize: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                ↷
              </button>

              <ActionButton onClick={() => vote(1)} disabled={saving} color="var(--accent)" label="Funny" title="Funny (→)">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </ActionButton>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', opacity: 0.5 }}>
              use ← → arrow keys to vote
            </p>
          </div>
        )}
      </main>
    </>
  )
}

function ActionButton({ onClick, disabled, color, label, title, children }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 68, height: 68, borderRadius: '50%',
          border: `2px solid ${color}`,
          background: hover ? color : 'transparent',
          color: hover ? (color === 'var(--accent)' ? '#000' : '#fff') : color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
          boxShadow: hover ? `0 4px 24px ${color}55` : 'none',
        }}
      >
        {children}
      </button>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  )
}

function VoteBadge({ label, color, textColor, side }) {
  return (
    <div style={{
      position: 'absolute', top: 20, [side]: 20, zIndex: 10,
      background: color, color: textColor,
      padding: '6px 14px', borderRadius: 8,
      fontWeight: 700, fontSize: 18, letterSpacing: '0.08em',
      transform: side === 'right' ? 'rotate(12deg)' : 'rotate(-12deg)',
      border: `2px solid ${textColor === '#fff' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'}`,
      pointerEvents: 'none',
    }}>
      {label}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 20, overflow: 'hidden',
        border: '2px solid var(--border)', animation: 'pulse 1.5s ease infinite',
      }}>
        <div style={{ paddingBottom: '65%', background: 'var(--surface2)' }} />
        <div style={{ padding: '1.5rem' }}>
          <div style={{ height: 18, background: 'var(--surface2)', borderRadius: 4, marginBottom: 10, width: '90%' }} />
          <div style={{ height: 18, background: 'var(--surface2)', borderRadius: 4, width: '65%' }} />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
      <p style={{ fontSize: 56, marginBottom: 16 }}>📭</p>
      <p style={{ fontSize: 18, marginBottom: 8, color: 'var(--text)' }}>Nothing here yet</p>
      <p style={{ fontSize: 14 }}>Be the first to <Link href="/upload" style={{ color: 'var(--accent)' }}>upload an image</Link>.</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{ textAlign: 'center', color: 'var(--danger)', maxWidth: 360 }}>
      <p style={{ fontSize: 14 }}>Failed to load: {message}</p>
    </div>
  )
}

function DoneState({ total }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 360 }}>
      <p style={{ fontSize: 56, marginBottom: 16 }}>🎉</p>
      <h2 style={{ fontSize: 24, marginBottom: 8 }}>You've seen them all</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        You rated all {total} captions. Come back later for more, or add your own.
      </p>
      <Link href="/upload" style={{
        display: 'inline-block', background: 'var(--accent)', color: '#000',
        padding: '10px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: 14,
      }}>
        Upload an image →
      </Link>
    </div>
  )
}