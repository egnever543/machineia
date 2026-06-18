import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, pain_points, target_audience, price, checkout_url } = body

  if (!name || !checkout_url) return NextResponse.json({ error: 'name and checkout_url required' }, { status: 400 })

  const { data: product, error: productError } = await supabase.from('products').insert({
    user_id: user.id, name, description, pain_points, target_audience, price, checkout_url
  }).select().single()

  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 })

  try {
    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Você é um especialista em copywriting e vendas digitais no Brasil.

Produto: ${name}
Descrição: ${description}
Dores que resolve: ${pain_points}
Público-alvo: ${target_audience}
Preço: ${price}

Crie:
1. Um system prompt para um chatbot de vendas conversacional em português BR informal que vai converter visitantes vindos de anúncios. Deve identificar a dor do visitante e no momento certo apresentar o produto como solução.
2. 5 hipóteses para testar (sobre abertura, ponto de dor principal, timing do CTA, tom, gancho).
3. Texto ideal para o botão CTA (máximo 8 palavras).

Responda APENAS com JSON válido:
{
  "system_prompt": "...",
  "cta_text": "...",
  "cta_trigger_message": 5,
  "hypotheses": [
    {"description": "...", "type": "opening"}
  ]
}`
      }]
    })

    const content = aiResponse.content[0]
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        await supabase.from('prompt_versions').insert({
          product_id: product.id,
          system_prompt: parsed.system_prompt,
          cta_text: parsed.cta_text || 'Quero garantir meu acesso',
          cta_trigger_message: parsed.cta_trigger_message || 5,
          is_active: true,
          notes: 'Versão inicial gerada pela IA'
        })
        if (parsed.hypotheses?.length) {
          await supabase.from('hypotheses').insert(
            parsed.hypotheses.map((h: any) => ({
              product_id: product.id,
              description: h.description,
              type: h.type || 'general',
              status: 'testing',
              confirmations_needed: 10
            }))
          )
        }
      }
    }
  } catch (e) {
    console.error('AI generation failed:', e)
  }

  return NextResponse.json({ id: product.id })
}
