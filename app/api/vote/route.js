import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  try {
    const supabase = await createClient()

    // Get logged-in user
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { captionId, vote } = await req.json()

    if (!captionId || (vote !== 1 && vote !== -1)) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    const { data: insertData, error: insertError } = await supabase
      .from('caption_votes')
      .insert({
        caption_id: captionId,
        profile_id: user.id,
        vote_value: vote,
        created_datetime_utc: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.log('VOTE INSERT ERROR:', insertError)
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, inserted: insertData })

  } catch (err) {
    console.error('SERVER ERROR:', err)
    return NextResponse.json(
      { error: 'Unexpected server error' },
      { status: 500 }
    )
  }
}