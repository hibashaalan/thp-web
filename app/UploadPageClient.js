'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/app/components/Nav'

const STAGES = {
  idle: null,
  uploading: 'Uploading image…',
  registering: 'Registering with pipeline…',
  generating: 'Generating captions…',
  done: 'Done!',
  error: null,
}

export default function UploadPage() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [stage, setStage] = useState('idle')
  const [error, setError] = useState(null)
  const [captions, setCaptions] = useState([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  const router = useRouter()

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

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)

  async function handleSubmit() {
    if (!file) return
    setError(null)
    setCaptions([])

    try {
      // Get auth token
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      if (!token) {
        setError('You must be signed in to upload images.')
        return
      }

      const BASE = 'https://api.almostcrackd.ai'
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }

      // Step 1: Get presigned URL
      setStage('uploading')
      const presignRes = await fetch(`${BASE}/pipeline/generate-presigned-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contentType: file.type }),
      })
      if (!presignRes.ok) throw new Error(`Presign failed: ${presignRes.status}`)
      const { presignedUrl, cdnUrl } = await presignRes.json()

      // Step 2: Upload image bytes to presigned URL
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      // Step 3: Register image URL in the pipeline
      setStage('registering')
      const registerRes = await fetch(`${BASE}/pipeline/upload-image-from-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      })
      if (!registerRes.ok) throw new Error(`Register failed: ${registerRes.status}`)
      const { imageId } = await registerRes.json()

      // Step 4: Generate captions
      setStage('generating')
      const captionRes = await fetch(`${BASE}/pipeline/generate-captions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ imageId }),
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

  return (
    <>
      <Nav />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', lineHeight: 1.1, marginBottom: 6 }}>
            Upload an Image
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            We'll generate captions using AI. Then vote on them in the feed.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => !busy && inputRef.current.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            border: `2px dashed ${dragging ? 'var(--accent)' : preview ? 'var(--border)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            background: dragging ? 'rgba(232,197,71,0.05)' : 'var(--surface)',
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
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <span style={{ color: '#fff', fontSize: 13, opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}
                    className="hover-text"
                  >
                    Click to change
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', pointerEvents: 'none' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🖼️</div>
              <p style={{ color: 'var(--text)', marginBottom: 6, fontWeight: 500 }}>
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

        {/* Stage indicator */}
        {busy && (
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Spinner />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{STAGES[stage]}</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(224,92,92,0.1)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: 'var(--danger)',
            fontSize: 14,
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!file || busy}
          style={{
            width: '100%',
            padding: '13px',
            background: !file || busy ? 'var(--surface2)' : 'var(--accent)',
            color: !file || busy ? 'var(--text-muted)' : '#000',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 15,
            fontWeight: 600,
            cursor: !file || busy ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s',
            marginBottom: 32,
          }}
        >
          {busy ? 'Processing…' : 'Generate Captions →'}
        </button>

        {/* Captions result */}
        {captions.length > 0 && (
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>✨</span> Generated Captions
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {captions.map((c, i) => (
                <div key={c.id || i} style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.25rem 1.5rem',
                  borderLeft: '3px solid var(--accent)',
                }}>
                  <p style={{
                    fontFamily: 'Playfair Display, serif',
                    fontStyle: 'italic',
                    fontSize: 16,
                    lineHeight: 1.6,
                    marginBottom: c.content ? 0 : 0,
                  }}>
                    "{c.content || c.caption || c.text || JSON.stringify(c)}"
                  </p>
                </div>
              ))}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 16 }}>
              Captions have been saved to the database.{' '}
              <a href="/list" style={{ color: 'var(--accent)' }}>View in feed →</a>
            </p>
          </div>
        )}
      </main>
    </>
  )
}

function Spinner() {
  return (
    <div style={{
      width: 16,
      height: 16,
      border: '2px solid var(--border)',
      borderTopColor: 'var(--accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}