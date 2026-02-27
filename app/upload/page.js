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
      setCaptions(captionArray)
      setStage('done')

    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong. Please try again.')
      setStage('error')
    }
  }

  const busy = ['uploading', 'registering', 'generating'].includes(stage)
  const currentStepIndex = STAGE_STEPS.indexOf(stage)

  if (!authChecked) return (
    <>
      <Nav />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <Spinner size={28} />
      </div>
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '3rem 1.5rem' }}>

        {/* Header */}
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
            border: `2px dashed ${dragging ? 'var(--accent)' : preview ? 'var(--border)' : 'var(--border)'}`,
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
              <img
                src={preview}
                alt="Preview"
                style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block' }}
              />
              {!busy && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0)',
                  transition: 'background 0.2s',
                  borderRadius: 18,
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.4)'
                    e.currentTarget.querySelector('span').style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0)'
                    e.currentTarget.querySelector('span').style.opacity = '0'
                  }}
                >
                  <span style={{
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    opacity: 0, transition: 'opacity 0.2s',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px', borderRadius: 8,
                  }}>
                    Click to change image
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', pointerEvents: 'none' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🖼️</div>
              <p style={{ color: 'var(--text)', marginBottom: 6, fontWeight: 500, fontSize: 15 }}>
                Drop an image here
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                or click to browse — JPEG, PNG, WebP, GIF, HEIC
              </p>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {/* Progress steps */}
        {busy && (
          <div style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--border)',
            borderRadius: 14,
            padding: '1.25rem 1.5rem',
            marginBottom: 16,
            animation: 'fadeUp 0.3s ease both',
          }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
              {STAGE_STEPS.slice(0, 3).map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: currentStepIndex > i
                      ? 'var(--accent)'
                      : currentStepIndex === i
                      ? 'var(--text)'
                      : 'var(--surface2)',
                    border: `2px solid ${currentStepIndex === i ? 'var(--text)' : 'transparent'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s',
                  }}>
                    {currentStepIndex > i
                      ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : currentStepIndex === i
                      ? <Spinner size={12} color="#fff" />
                      : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'block' }} />
                    }
                  </div>
                  {i < 2 && <div style={{ flex: 1, height: 2, background: currentStepIndex > i ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s', margin: '0 4px' }} />}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {STAGES[stage]}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'var(--danger-pale)',
            border: '1.5px solid rgba(192,57,43,0.25)',
            borderRadius: 10,
            padding: '12px 16px',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 16,
            animation: 'fadeUp 0.3s ease both',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!file || busy}
          style={{
            width: '100%',
            padding: '14px',
            background: !file || busy ? 'var(--surface2)' : 'var(--text)',
            color: !file || busy ? 'var(--text-muted)' : 'var(--bg)',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 600,
            cursor: !file || busy ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            marginBottom: 36,
            transform: !file || busy ? 'none' : 'translateY(0)',
            boxShadow: !file || busy ? 'none' : 'var(--shadow)',
            animation: 'fadeUp 0.4s ease 0.2s both',
          }}
          onMouseEnter={e => { if (file && !busy) e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
        >
          {busy ? 'Processing…' : 'Generate Captions →'}
        </button>

        {/* Results */}
        {captions.length > 0 && (
          <div style={{ animation: 'fadeUp 0.5s ease both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{ fontSize: 24 }}>✨</span>
              <h2 style={{ fontSize: 22 }}>Generated Captions</h2>
              <span style={{
                background: 'var(--accent-pale)',
                color: 'var(--accent)',
                border: '1.5px solid rgba(196,146,42,0.3)',
                borderRadius: 20,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {captions.length}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {captions.map((c, i) => (
                <div key={c.id || i} style={{
                  background: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 14,
                  padding: '1.25rem 1.5rem',
                  borderLeft: '3px solid var(--accent)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
                }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <p style={{
                    fontFamily: 'Fraunces, serif',
                    fontStyle: 'italic',
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: 'var(--text)',
                  }}>
                    "{c.content || c.caption || c.text || JSON.stringify(c)}"
                  </p>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 24,
              padding: '1rem 1.25rem',
              background: 'var(--accent-pale)',
              border: '1.5px solid rgba(196,146,42,0.25)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}>
              <p style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                🎉 Captions saved to the database
              </p>
              <a href="/list" style={{
                fontSize: 13, fontWeight: 600, color: 'var(--accent)',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                View in feed →
              </a>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
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