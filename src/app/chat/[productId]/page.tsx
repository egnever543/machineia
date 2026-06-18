import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('id, name').eq('id', productId).single()
  if (!product) notFound()
  return <ChatInterface productId={product.id} productName={product.name} />
}
