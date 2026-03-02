'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'
import { createClient } from '@/lib/supabase/client'

const STAGES = {
  idle: null,
  uploading: 'Uploading image…',
  registering: 'Registering with pipeline…',
  generating: 'Generating captions…',
  done: 'Done!',
  error: null,
}

const STAGE_STEPS = ['uploading', 'registering', 'generating', 'done']

export default function UploadPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [stage, setStage] = useState('idle')
  const [error, setError] = useState(null)
  const [captions, setCaptions] = useState([])
  const [dragging, setDragging] = useState(false)

  // Caption carousel state
  const [captionIndex, setCaptionIndex] = useState(0)
  const [voteState, setVoteState] = useState(null)
  const [animating, setAnimating] = useState(null)
  const [saving, setSaving] = useState(false)

  const inputRef = useRef()
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) router.replace('/login')
      else setAuthChecked(true)
    })
  }, [router])

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setCaptions([])
    setError(null)
    setStage('idle')
    setCaptionIndex(0)
    setVoteState(null)
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  async function handleSubmit() {
    if (!file) return
    setError(null)
    setCaptions([])
    setCaptionIndex(0)

    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) { setError('You must be signed in to upload images.'); return }

      const BASE = 'https://api.almostcrackd.ai'
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      setStage('uploading')
      const presignRes = await fetch(`${BASE}/pipeline/generate-presigned-url`, {
        method: 'POST', headers, body: JSON.stringify({ contentType: file.type }),
      })
      if (!presignRes.ok) throw new Error(`Presign failed: ${presignRes.status}`)
      const { presignedUrl, cdnUrl } = await presignRes.json()

      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT', headers: { 'Content-Type': file.type }, body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      setStage('registering')
      const registerRes = await fetch(`${BASE}/pipeline/upload-image-from-url`, {
        method: 'POST', headers, body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      })
      if (!registerRes.ok) throw new Error(`Register failed: ${registerRes.status}`)
      const { imageId } = await registerRes.json()

      setStage('generating')
      const captionRes = await fetch(`${BASE}/pipeline/generate-captions`, {
        method: 'POST', headers, body: JSON.stringify({ imageId }),
      })
      if (!captionRes.ok) throw new Error(`Caption generation failed: ${captionRes.status}`)
      const captionData = await captionRes.json()

      const captionArray = Array.isArray(captionData) ? captionData : [captionData]
      setCaptions(captionArray.filter(c => (c.content || c.caption || c.text)?.trim()))
      setStage('done')

    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
      setStage('error')
    }
  }

  // Voting on the preview carousel
  const advance = useCallback((direction) => {
    setAnimating(direction)
    setTimeout(() => {
      setCaptionIndex(i => i + 1)
      setVoteState(null)
      setAnimating(null)
    }, 380)
  }, [])

  const vote = useCallback(async (value) => {
    if (saving || captionIndex >= captions.length) return
    const current = captions[captionIndex]
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
  }, [saving, captionIndex, captions, advance])

  const skip = useCallback(() => {
    if (captionIndex >= captions.length) return
    advance('up')
  }, [captionIndex, captions, advance])

  // Keyboard shortcuts when in carousel mode
  useEffect(() => {
    if (captions.length === 0) return
    const handler = (e) => {
      if (e.key === 'ArrowRight') vote(1)
      if (e.key === 'ArrowLeft') vote(-1)
      if (e.key === 'ArrowDown') skip()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [vote, skip, captions.length])

  const busy = ['uploading', 'registering', 'generating'].includes(stage)
  const currentStepIndex = STAGE_STEPS.indexOf(stage)
  const currentCaption = captions[captionIndex]
  const allDone = captions.length > 0 && captionIndex >= captions.length

  if (!authChecked) return (
    <>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <Spinner size={28} />
      </div>
    </>
  )

  // After captions generated — show full-screen carousel like the list page
  if (stage === 'done' && captions.length > 0) {
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
          {allDone ? (
            <div style={{ textAlign: 'center', maxWidth: 380, animation: 'fadeUp 0.4s ease both' }}>
              <div style={{ fontSize: 64, marginBottom: 24 }}>🎉</div>
              <h2 style={{ fontSize: 28, marginBottom: 10 }}>All rated!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
                You voted on all {captions.length} captions for your image.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button onClick={() => { setStage('idle'); setFile(null); setPreview(null); setCaptions([]); setCaptionIndex(0) }}
                  style={{ padding: '11px 22px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Upload another
                </button>
                <a href="/list" style={{
                  display: 'inline-block', background: 'var(--text)', color: 'var(--bg)',
                  padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14,
                }}>
                  See the feed →
                </a>
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: 460, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, animation: 'fadeUp 0.4s ease both' }}>

              {/* Header */}
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                  ✨ Your generated captions
                </p>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {captionIndex + 1} / {captions.length}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: '100%', height: 4, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(captionIndex / captions.length) * 100}%`,
                  background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                  borderRadius: 4,
                  transition: 'width 0.4s ease',
                }} />
              </div>

              {/* Card */}
              <div
                key={currentCaption?.id || captionIndex}
                style={{
                  position: 'relative',
                  width: '100%',
                  background: 'var(--surface)',
                  border: `2px solid ${voteState === 'up' ? 'var(--accent)' : voteState === 'down' ? 'var(--danger)' : 'var(--border)'}`,
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
                {voteState === 'up' && <VoteBadge label="FUNNY" color="var(--accent)" textColor="#1c1a17" side="right" />}
                {voteState === 'down' && <VoteBadge label="MEH" color="var(--danger)" textColor="#fff" side="left" />}

                {/* Image */}
                <div style={{ position: 'relative', paddingBottom: '62%', overflow: 'hidden', background: 'var(--bg2)' }}>
                  <img
                    src={preview}
                    alt="your upload"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
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
                  }}>
                    "{currentCaption?.content || currentCaption?.caption || currentCaption?.text}"
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <ActionButton onClick={() => vote(-1)} disabled={saving} color="var(--danger)" bgHover="var(--danger-pale)" label="Meh" size={64}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </ActionButton>

                <SkipButton onClick={skip} />

                <ActionButton onClick={() => vote(1)} disabled={saving} color="var(--accent)" bgHover="var(--accent-pale)" label="Funny" size={64}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </ActionButton>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <KbdHint keys={['←']} label="meh" />
                <KbdHint keys={['↓']} label="skip" />
                <KbdHint keys={['→']} label="funny" />
              </div>
            </div>
          )}
        </main>
        <style>{`
          @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
      </>
    )
  }

  // Upload form
  return (
    <>
      <Nav />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem' }}>

        <div style={{ marginBottom: '2.5rem', animation: 'fadeUp 0.4s ease both' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', lineHeight: 1.15, marginBottom: 8 }}>
            Upload an Image
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            We'll generate captions using AI — then others can vote on them.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => !busy && inputRef.current.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 20,
            background: dragging ? 'var(--accent-pale)' : preview ? 'transparent' : 'var(--surface)',
            cursor: busy ? 'default' : 'pointer',
            transition: 'all 0.2s',
            overflow: 'hidden',
            minHeight: preview ? 'auto' : 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            position: 'relative',
            animation: 'fadeUp 0.4s ease 0.1s both',
          }}
        >
          {preview ? (
            <>
              <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }} />
              {!busy && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.2s', borderRadius: 18 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.4)'; e.currentTarget.querySelector('span').style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelector('span').style.opacity = '0' }}
                >
                  <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, opacity: 0, transition: 'opacity 0.2s', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 8 }}>
                    Click to change image
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', pointerEvents: 'none' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🖼️</div>
              <p style={{ color: 'var(--text)', marginBottom: 6, fontWeight: 500, fontSize: 15 }}>Drop an image here</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>or click to browse — JPEG, PNG, WebP, GIF, HEIC</p>
            </div>
          )}
        </div>

        <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
          style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

        {/* Progress steps */}
        {busy && (
          <div style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: 16, animation: 'fadeUp 0.3s ease both' }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
              {STAGE_STEPS.slice(0, 3).map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: currentStepIndex > i ? 'var(--accent)' : currentStepIndex === i ? 'var(--text)' : 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                  }}>
                    {currentStepIndex > i
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : currentStepIndex === i ? <Spinner size={12} color="#fff" />
                      : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'block' }} />
                    }
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: currentStepIndex > i ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s', margin: '0 4px' }} />}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{STAGES[stage]}</p>
          </div>
        )}

        {error && (
          <div style={{ background: 'var(--danger-pale)', border: '1.5px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={!file || busy}
          style={{
            width: '100%', padding: '14px',
            background: !file || busy ? 'var(--surface2)' : 'var(--text)',
            color: !file || busy ? 'var(--text-muted)' : 'var(--bg)',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
            cursor: !file || busy ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', animation: 'fadeUp 0.4s ease 0.2s both',
          }}
          onMouseEnter={e => { if (file && !busy) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {busy ? 'Processing…' : 'Generate Captions →'}
        </button>
      </main>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </>
  )
}

function ActionButton({ onClick, disabled, color, bgHover, label, size, children }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <button onClick={onClick} disabled={disabled}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          width: size, height: size, borderRadius: '50%',
          border: `2px solid ${color}`,
          background: hover ? bgHover : 'var(--surface)',
          color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'all 0.18s',
          transform: hover ? 'scale(1.08)' : 'scale(1)',
          boxShadow: hover ? `0 6px 20px ${color}30` : 'var(--shadow-sm)',
        }}>
        {children}
      </button>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
    </div>
  )
}

function SkipButton({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
      <button onClick={onClick}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          width: 44, height: 44, borderRadius: '50%',
          border: '1.5px solid var(--border)',
          background: hover ? 'var(--surface2)' : 'var(--surface)',
          color: hover ? 'var(--text-mid)' : 'var(--text-muted)',
          fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
          transform: hover ? 'scale(1.06)' : 'scale(1)',
        }}>↷</button>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Skip</span>
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
          border: '1px solid var(--border)', background: 'var(--surface)',
          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Instrument Sans, sans-serif',
          boxShadow: '0 1px 0 var(--border)',
        }}>{k}</kbd>
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
      pointerEvents: 'none',
      boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
    }}>
      {label}
    </div>
  )
}

function Spinner({ size = 16, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size, height: size,
      border: `2px solid ${color}40`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}