'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ListPage() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('caption_examples')
        .select('*')

      if (error) {
        setError(error.message)
      } else {
        setRows(data)
      }
    }

    fetchData()
  }, [])

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Supabase Data</h1>

      {error && <p>Error: {error}</p>}

      <ul>
        {rows.map((row) => (
          <li key={row.id}>
            <strong>ID:</strong> {row.id} <br/>
            <strong>Caption:</strong> {row.caption}
          </li>
        ))}
      </ul>

    </div>
  )
}
