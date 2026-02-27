import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UploadPageClient from './UploadPageClient'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/login')
  }

  return <UploadPageClient />
}