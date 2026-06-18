import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LogOut, Plus, MessageSquare, TrendingUp } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: products } = await supabase.from('products').select('*').eq('user_id', user!.id)

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white">MachineIA</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
        </div>
        <form action="/api/auth/signout" method="post">
          <button className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition">
            <LogOut size={16} /> Sair
          </button>
        </form>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Seus produtos</h2>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          <Plus size={16} /> Novo produto
        </Link>
      </div>
      {!products?.length ? (
        <div className="border border-dashed border-gray-700 rounded-2xl p-16 text-center">
          <p className="text-gray-400 mb-4">Nenhum produto ainda</p>
          <Link href="/admin/products/new" className="text-purple-400 hover:underline text-sm">Criar seu primeiro produto →</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{product.description?.slice(0, 100)}...</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={`/chat/${product.id}`} target="_blank" className="flex items-center gap-2 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-2 rounded-lg text-sm transition">
                  <MessageSquare size={14} /> Ver chat
                </Link>
                <Link href={`/admin/products/${product.id}`} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition">
                  <TrendingUp size={14} /> Dashboard
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
