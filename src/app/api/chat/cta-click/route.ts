import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { sessionId } = await req.json()
  await supabase.from('chat_sessions').update({ cta_clicked: true }).eq('id', sessionId)
  return NextResponse.json({ ok: true })
}
