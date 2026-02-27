'use client'

import { useState } from 'react'

export default function VoteButtons({ captionId }) {
  const [status, setStatus] = useState('')
  const [voted, setVoted] = useState(null) // 1, -1, or null

  async function sendVote(vote) {
    if (voted === vote) return

    setStatus('saving')

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captionId, vote }),
    })

    if (res.status === 401) {
      setStatus('login')
      return
    }

    const data = await res.json()

    if (!res.ok) {
      if (data.error?.includes('duplicate') || data.error?.includes('unique')) {
        setVoted(vote)
        setStatus('done')
      } else {
        setStatus('error')
      }
      setTimeout(() => setStatus(''), 2000)
      return
    }

    setVoted(vote)
    setStatus('done')
    setTimeout(() => setStatus(''), 1500)
  }

  const btnBase = {
    border: 'none',
    borderRadius: 8,
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    transition: 'all 0.15s',
    cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button
        onClick={() => sendVote(1)}
        style={{
          ...btnBase,
          background: voted === 1 ? 'var(--accent)' : 'var(--surface2)',
          color: voted === 1 ? '#000' : 'var(--text-muted)',
        }}
        title="Upvote"
      >
        <span>▲</span> Funny
      </button>

      <button
        onClick={() => sendVote(-1)}
        style={{
          ...btnBase,
          background: voted === -1 ? '#3a1515' : 'var(--surface2)',
          color: voted === -1 ? 'var(--danger)' : 'var(--text-muted)',
        }}
        title="Downvote"
      >
        <span>▼</span> Meh
      </button>

      {status === 'saving' && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saving…</span>
      )}
      {status === 'done' && (
        <span style={{ fontSize: 12, color: 'var(--success)' }}>✓ Voted</span>
      )}
      {status === 'login' && (
        <span style={{ fontSize: 12, color: 'var(--danger)' }}>
          <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a> to vote
        </span>
      )}
      {status === 'error' && (
        <span style={{ fontSize: 12, color: 'var(--danger)' }}>Error. Try again.</span>
      )}
    </div>
  )
}