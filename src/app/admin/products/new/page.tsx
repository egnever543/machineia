'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProductPage() {
  const [form, setForm] = useState({ name: '', description: '', pain_points: '', target_audience: '', price: '', checkout_url: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const fields = [
    { key: 'name', label: 'Nome do produto', placeholder: 'Ex: Ebook Gatilhos de Vendas', textarea: false },
    { key: 'description', label: 'Descrição completa', placeholder: 'O que é o produto, o que ensina, qual transformação entrega...', textarea: true },
    { key: 'pain_points', label: 'Dores que resolve', placeholder: 'Liste as principais dores do seu público...', textarea: true },
    { key: 'target_audience', label: 'Público-alvo', placeholder: 'Quem é o comprador ideal? Descreva bem.', textarea: true },
    { key: 'price', label: 'Preço', placeholder: 'Ex: R$ 47', textarea: false },
    { key: 'checkout_url', label: 'Link do checkout (Kiwify)', placeholder: 'https://pay.kiwify.com.br/...', textarea: false },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/admin/products/${data.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <a href="/admin" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">← Voltar</a>
      <h1 className="text-2xl font-bold text-white mb-2">Novo produto</h1>
      <p className="text-gray-400 text-sm mb-8">A IA vai usar essas informações para criar o chat e as hipóteses iniciais.</p>
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-sm text-gray-400 block mb-1">{f.label}</label>
            {f.textarea ? (
              <textarea value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder} rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 resize-none" />
            ) : (
              <input type="text" value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                required={f.key === 'name' || f.key === 'checkout_url'}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
            )}
          </div>
        ))}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition">
          {loading ? 'Criando produto e gerando IA...' : 'Criar produto'}
        </button>
      </form>
    </div>
  )
}
