import React, { useState, useRef, useEffect } from 'react'
import './styles.css'

export default function Assistant({ product } = {}){
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hi — I can help summarize product information, materials and sourcing. Ask me about this product.' }
  ])
  const listRef = useRef(null)

  useEffect(() => { scrollToBottom() }, [messages])

  function scrollToBottom(){
    try{ if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }catch(e){}
  }

  function send(){
    const text = (input || '').trim()
    if (!text || sending) return
    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)

    // Mock assistant response: simple echo + small heuristic using product info
    setTimeout(() => {
      const productName = product && product.title ? ` about “${product.title.split('\n')[0].slice(0,80)}”` : ''
      const replyText = `I heard: "${text}". I can look at the product${productName} and summarize available metadata (title, brand, price, sku).`
      const assistantMsg = { id: Date.now() + 1, role: 'assistant', text: replyText }
      setMessages(m => [...m, assistantMsg])
      setSending(false)
    }, 700)
  }

  function onKeyDown(e){
    if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send() }
  }

  return (
    <div className="assistant-root">
      <div className="assistant-header">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div>
            <div className="assistant-title">ecotag Assistant</div>
            <div className="assistant-sub">Minimal. Private. Local-first.</div>
          </div>
          <div style={{fontSize:12,color:'var(--muted)'}}>{product && product.site ? product.site : ''}</div>
        </div>
      </div>

      <div className="assistant-body">
        <div ref={listRef} className="assistant-messages" aria-live="polite">
          {messages.map(m => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="msg-bubble">{m.text}</div>
            </div>
          ))}
          {sending && (
            <div className="msg assistant">
              <div className="msg-bubble">Thinking…</div>
            </div>
          )}
        </div>

        <div className="assistant-input-row">
          <textarea
            className="assistant-input"
            placeholder="Ask a question about this product…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
          />
          <button className="btn btn-primary" onClick={send} disabled={!input.trim() || sending} aria-disabled={!input.trim() || sending}>
            {sending ? 'Sending…' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  )
}
