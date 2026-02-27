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
  const [voteState, setVoteState] = useState(null)
  const [animating, setAnimating] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('captions')
      .select('id, content, image_id, images!inner(url)')
      .not('image_id', 'is', null)
      .order('id', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else {
          const withImages = (data || []).filter(r => r.images?.url && r.content?.trim())
          setCaptions(withImages)
        }
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
    }, 380)
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
    advance('up')
  }, [current, advance])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') vote(1)
      if (e.key === 'ArrowLeft') vote(-1)
      if (e.key === 'ArrowDown') skip()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [vote, skip])

  const progress = captions.length > 0 ? (index / captions.length) * 100 : 0

  return (
    <>
      <Nav />
      <main style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'var(--bg)',
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
          <div style={{
            width: '100%',
            maxWidth: 460,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
            animation: 'fadeUp 0.4s ease both',
          }}>
            {/* Progress */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                flex: 1, height: 4, background: 'var(--surface2)',
                borderRadius: 4, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <span style={{
                fontSize: 12, color: 'var(--text-muted)', fontWeight: 500,
                whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums',
              }}>
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
                  ? '0 8px 40px rgba(196,146,42,0.2)'
                  : voteState === 'down'
                  ? '0 8px 40px rgba(192,57,43,0.15)'
                  : 'var(--shadow-lg)',
                transform: animating === 'right'
                  ? 'translateX(130%) rotate(14deg)'
                  : animating === 'left'
                  ? 'translateX(-130%) rotate(-14deg)'
                  : animating === 'up'
                  ? 'translateY(-120%) scale(0.92)'
                  : 'translateX(0) rotate(0deg)',
                opacity: animating ? 0 : 1,
                transition: animating
                  ? 'transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease'
                  : 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Stamp badges */}
              {voteState === 'up' && <VoteBadge label="FUNNY" color="var(--accent)" textColor="#1c1a17" side="right" />}
              {voteState === 'down' && <VoteBadge label="MEH" color="var(--danger)" textColor="#fff" side="left" />}

              {/* Image */}
              <div style={{
                position: 'relative',
                paddingBottom: '62%',
                overflow: 'hidden',
                background: 'var(--bg2)',
              }}>
                <img
                  src={current.images.url}
                  alt="caption image"
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                />
              </div>

              {/* Caption */}
              <div style={{ padding: '1.4rem 1.75rem 1.75rem' }}>
                <p style={{
                  fontFamily: 'Fraunces, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                  lineHeight: 1.6,
                  color: 'var(--text)',
                  fontWeight: 400,
                }}>
                  "{current.content}"
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
              marginTop: 4,
            }}>
              <ActionButton
                onClick={() => vote(-1)}
                disabled={saving}
                color="var(--danger)"
                bgHover="var(--danger-pale)"
                label="Meh"
                title="Meh (←)"
                size={64}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </ActionButton>

              <SkipButton onClick={skip} />

              <ActionButton
                onClick={() => vote(1)}
                disabled={saving}
                color="var(--accent)"
                bgHover="var(--accent-pale)"
                label="Funny"
                title="Funny (→)"
                size={64}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </ActionButton>
            </div>

            <div style={{
              display: 'flex',
              gap: 16,
              alignItems: 'center',
            }}>
              <KbdHint keys={['←']} label="meh" />
              <KbdHint keys={['↓']} label="skip" />
              <KbdHint keys={['→']} label="funny" />
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}

function ActionButton({ onClick, disabled, color, bgHover, label, title, size, children }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: size, height: size, borderRadius: '50%',
          border: `2px solid ${color}`,
          background: hover ? bgHover : 'var(--surface)',
          color: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'all 0.18s',
          transform: hover ? 'scale(1.08)' : 'scale(1)',
          boxShadow: hover ? `0 6px 20px ${color}30` : 'var(--shadow-sm)',
        }}
      >
        {children}
      </button>
      <span style={{
        fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
        letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  )
}

function SkipButton({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, marginBottom: 0 }}>
      <button
        onClick={onClick}
        title="Skip (↓)"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '1.5px solid var(--border)',
          background: hover ? 'var(--surface2)' : 'var(--surface)',
          color: hover ? 'var(--text-mid)' : 'var(--text-muted)',
          fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s',
          transform: hover ? 'scale(1.06)' : 'scale(1)',
        }}
      >
        ↷
      </button>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
        Skip
      </span>
    </div>
  )
}

function KbdHint({ keys, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {keys.map(k => (
        <kbd key={k} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 5,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          fontSize: 11, color: 'var(--text-muted)',
          fontFamily: 'Instrument Sans, sans-serif',
          boxShadow: '0 1px 0 var(--border)',
        }}>
          {k}
        </kbd>
      ))}
      <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>{label}</span>
    </div>
  )
}

function VoteBadge({ label, color, textColor, side }) {
  return (
    <div style={{
      position: 'absolute', top: 18, [side]: 18, zIndex: 10,
      background: color, color: textColor,
      padding: '5px 13px', borderRadius: 8,
      fontWeight: 700, fontSize: 16, letterSpacing: '0.1em',
      transform: side === 'right' ? 'rotate(10deg)' : 'rotate(-10deg)',
      border: '2px solid rgba(0,0,0,0.12)',
      fontFamily: 'Instrument Sans, sans-serif',
      pointerEvents: 'none',
      boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
    }}>
      {label}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div style={{ width: '100%', maxWidth: 460 }}>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 20,
        overflow: 'hidden',
        border: '2px solid var(--border)',
        animation: 'pulse 1.8s ease infinite',
      }}>
        <div style={{ paddingBottom: '62%', background: 'var(--surface2)' }} />
        <div style={{ padding: '1.5rem 1.75rem' }}>
          <div style={{ height: 16, background: 'var(--surface2)', borderRadius: 4, marginBottom: 10, width: '88%' }} />
          <div style={{ height: 16, background: 'var(--surface2)', borderRadius: 4, width: '60%' }} />
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>📭</div>
      <h2 style={{ fontSize: 24, marginBottom: 8, color: 'var(--text)' }}>Nothing here yet</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Be the first to add something funny.</p>
      <Link href="/upload" style={{
        display: 'inline-block',
        background: 'var(--text)', color: 'var(--bg)',
        padding: '10px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14,
      }}>
        Upload an image →
      </Link>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{
      textAlign: 'center',
      color: 'var(--danger)',
      background: 'var(--danger-pale)',
      border: '1.5px solid rgba(192,57,43,0.2)',
      borderRadius: 12,
      padding: '1.5rem 2rem',
      maxWidth: 360,
      fontSize: 14,
    }}>
      Failed to load: {message}
    </div>
  )
}

function DoneState({ total }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 380, animation: 'fadeUp 0.4s ease both' }}>
      <div style={{ fontSize: 64, marginBottom: 24, animation: 'float 2.5s ease infinite' }}>🎉</div>
      <h2 style={{ fontSize: 28, marginBottom: 10 }}>You've seen them all!</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
        You rated all {total} captions.<br/>Come back later for more — or add your own.
      </p>
      <Link href="/upload" style={{
        display: 'inline-block',
        background: 'var(--text)', color: 'var(--bg)',
        padding: '12px 28px', borderRadius: 10,
        fontWeight: 600, fontSize: 14,
        transition: 'opacity 0.15s',
      }}>
        Upload an image →
      </Link>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}