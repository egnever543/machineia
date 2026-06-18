import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { productId, sessionId, messages, visitorId } = await req.json()

  const { data: product } = await supabase.from('products').select('*').eq('id', productId).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const { data: activePrompt } = await supabase.from('prompt_versions').select('*').eq('product_id', productId).eq('is_active', true).single()
  if (!activePrompt) return NextResponse.json({ error: 'No active prompt' }, { status: 404 })

  let currentSessionId = sessionId
  if (!currentSessionId) {
    const { data: session } = await supabase.from('chat_sessions').insert({
      product_id: productId,
      prompt_version_id: activePrompt.id,
      visitor_id: visitorId,
      message_count: 0
    }).select().single()
    currentSessionId = session?.id
  }

  const userMessageCount = messages.filter((m: any) => m.role === 'user').length
  const alreadyShownCTA = messages.some((m: any) => m.showCTA)
  const showCTA = userMessageCount >= activePrompt.cta_trigger_message && !alreadyShownCTA

  await supabase.from('chat_sessions').update({
    message_count: userMessageCount,
    ...(showCTA ? { cta_shown: true, cta_shown_at_message: userMessageCount } : {})
  }).eq('id', currentSessionId)

  const aiMessages = messages.map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: activePrompt.system_prompt,
    messages: aiMessages
  })

  const assistantText = response.content[0].type === 'text' ? response.content[0].text : ''

  await supabase.from('messages').insert({ session_id: currentSessionId, role: 'assistant', content: assistantText })

  return NextResponse.json({
    message: assistantText,
    sessionId: currentSessionId,
    showCTA,
    ctaText: activePrompt.cta_text,
    checkoutUrl: product.checkout_url
  })
}
