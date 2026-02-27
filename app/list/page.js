'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import VoteButtons from './VoteButtons'

export default function ListPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('captions')
        .select('id, content, image_id, images(url)')

      if (error) setError(error.message)
      else setRows(data || [])
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Captions</h1>
      {error && <p>Error: {error}</p>}

      <ul style={{ display: 'grid', gap: 12, padding: 0, listStyle: 'none' }}>
        {rows.map((row) => (
          <li key={row.id} style={{ border: '1px solid #ddd', padding: 12 }}>
            {row.images?.url && (
              <img
                src={row.images.url}
                alt="caption image"
                style={{ width: 300, height: 'auto', marginBottom: 8, borderRadius: 8 }}
              />
            )}

            <div style={{ marginBottom: 8 }}>
              <strong>{row.content}</strong>
            </div>

            <VoteButtons captionId={row.id} />
          </li>
        ))}
      </ul>
    </div>
  )
}