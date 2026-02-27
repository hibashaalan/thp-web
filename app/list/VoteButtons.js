'use client'

import { useState } from 'react'

export default function VoteButtons({ captionId }) {
  const [status, setStatus] = useState('')

  async function sendVote(vote) {
    setStatus('Saving...')

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captionId, vote }),
    })

    if (res.status === 401) {
      setStatus('Please log in to vote.')
      return
    }

    const data = await res.json()
    if (!res.ok) {
      setStatus(`Error: ${data.error || 'Unknown error'}`)
      return
    }

    setStatus('Saved!')
    setTimeout(() => setStatus(''), 1500)
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <button onClick={() => sendVote(1)}>👍</button>
      <button onClick={() => sendVote(-1)}>👎</button>
      {status && <span style={{ fontSize: 12 }}>{status}</span>}
    </div>
  )
}