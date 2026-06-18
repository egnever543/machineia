import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ExternalLink, MessageSquare, MousePointer, Clock } from 'lucide-react'

export default async function ProductDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: product } = await supabase.from('products').select('*').eq('id', id).eq('user_id', user!.id).single()
  if (!product) notFound()

  const { data: sessions } = await supabase.from('chat_sessions').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(50)
  const { data: hypotheses } = await supabase.from('hypotheses').select('*').eq('product_id', id).order('created_at', { ascending: false })
  const { data: activePrompt } = await supabase.from('prompt_versions').select('*').eq('product_id', id).eq('is_active', true).single()

  const totalSessions = sessions?.length || 0
  const ctaShown = sessions?.filter((s: any) => s.cta_shown).length || 0
  const ctaClicked = sessions?.filter((s: any) => s.cta_clicked).length || 0
  const ctaRate = ctaShown ? Math.round((ctaClicked / ctaShown) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <a href="/admin" className="text-gray-400 hover:text-white text-sm mb-2 inline-block">← Voltar</a>
          <h1 className="text-2xl font-bold text-white">{product.name}</h1>
        </div>
        <Link href={`/chat/${product.id}`} target="_blank" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <ExternalLink size={14} /> Abrir chat
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Sessões totais', value: totalSessions, icon: MessageSquare },
          { label: 'CTA exibido', value: ctaShown, icon: Clock },
          { label: 'Taxa de clique CTA', value: `${ctaRate}%`, icon: MousePointer },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3"><Icon size={14} /> {label}</div>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Hipóteses em teste</h2>
          {!hypotheses?.length ? <p className="text-gray-500 text-sm">Nenhuma hipótese ainda</p> : (
            <div className="space-y-3">
              {hypotheses.map((h: any) => (
                <div key={h.id} className="border border-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${h.status === 'confirmed' ? 'bg-green-900 text-green-300' : h.status === 'rejected' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{h.status}</span>
                    <span className="text-gray-500 text-xs">{h.confirmations_count}/{h.confirmations_needed}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{h.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Prompt ativo</h2>
          {activePrompt ? (
            <div>
              <div className="bg-gray-800 rounded-lg p-3 mb-3">
                <p className="text-gray-300 text-xs font-mono leading-relaxed">{activePrompt.system_prompt.slice(0, 400)}...</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">CTA: <span className="text-white">&ldquo;{activePrompt.cta_text}&rdquo;</span></span>
                <span className="text-gray-400">Msg #{activePrompt.cta_trigger_message}</span>
              </div>
            </div>
          ) : <p className="text-gray-500 text-sm">Nenhum prompt ativo</p>}
        </div>
      </div>
    </div>
  )
}
