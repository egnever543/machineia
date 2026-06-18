'use client'
import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  showCTA?: boolean
  ctaText?: string
  checkoutUrl?: string
}

export default function ChatInterface({ productId, productName }: { productId: string; productName: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const getVisitorId = () => {
    const stored = localStorage.getItem('visitor_id')
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem('visitor_id', id)
    return id
  }

  useEffect(() => {
    if (!started) {
      setStarted(true)
      sendMessage('', true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(userInput: string, isInitial = false) {
    if (!isInitial && !userInput.trim()) return
    setLoading(true)

    const currentMessages: Message[] = isInitial
      ? [{ role: 'user', content: 'Olá' }]
      : [...messages, { role: 'user', content: userInput }]

    if (!isInitial) {
      setMessages(prev => [...prev, { role: 'user', content: userInput }])
    }
    setInput('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          sessionId,
          visitorId: getVisitorId(),
          messages: currentMessages
        })
      })
      const data = await res.json()
      if (data.sessionId) setSessionId(data.sessionId)

      setMessages(prev => {
        const base = isInitial ? [] : prev
        return [...base, {
          role: 'assistant',
          content: data.message,
          showCTA: data.showCTA,
          ctaText: data.ctaText,
          checkoutUrl: data.checkoutUrl
        }]
      })
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handleCTAClick(checkoutUrl: string) {
    if (sessionId) {
      await fetch('/api/chat/cta-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
    }
    window.open(checkoutUrl, '_blank')
  }

  return (
    <div className="bg-gray-950 flex flex-col" style={{ height: '100dvh' }}>
      <div className="flex-shrink-0 border-b border-gray-800 px-4 py-3 bg-gray-900 safe-top">
        <p className="text-white font-semibold text-sm text-center">{productName}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-100'} rounded-2xl px-4 py-3 text-sm leading-relaxed`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.showCTA && msg.checkoutUrl && (
                <button
                  onClick={() => handleCTAClick(msg.checkoutUrl!)}
                  className="mt-4 block w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-6 rounded-xl text-center transition text-base"
                >
                  {msg.ctaText || 'Quero garantir meu acesso'}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-2xl px-4 py-4">
              <div className="flex gap-1">
                {[0, 150, 300].map(delay => (
                  <span key={delay} className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex-shrink-0 border-t border-gray-800 px-4 py-3 bg-gray-900 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder="Digite sua mensagem..."
            disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 text-sm disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white p-3 rounded-xl transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
