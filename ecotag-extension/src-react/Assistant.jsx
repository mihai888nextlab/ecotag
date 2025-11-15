import React, { useState, useRef, useEffect } from 'react'
import './styles.css'

// Minimal assistant UI that posts to http://localhost:3000/api/gemini
export default function Assistant({ product } = {}){
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: 'Hi — I can help summarize product information. Ask me about this product.' }
  ])
  const listRef = useRef(null)

  useEffect(() => { scrollToBottom() }, [messages])

  function scrollToBottom(){
    try{ if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }catch(e){}
  }

  async function send(){
    const text = (input || '').trim()
    if (!text || sending) return
    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)

    const url = 'http://localhost:3000/api/gemini'

    // timeout via AbortController
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try{
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, product }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const j = await resp.json()
      const reply = (j && (j.reply || j.output || j.result)) || null
      const replyText = typeof reply === 'string' ? reply : (reply && JSON.stringify(reply)) || 'No reply content.'
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', text: replyText }])
    }catch(e){
      // network or server error — show helpful error and a local fallback reply
      console.error('Gemini request failed', e)
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', text: `Unable to contact assistant ( ${e && e.message} ). Showing fallback.` }])
      const productName = product && product.title ? ` about “${product.title.split('\n')[0].slice(0,80)}”` : ''
      setMessages(m => [...m, { id: Date.now()+2, role: 'assistant', text: `Fallback: I heard "${text}". I can summarize ${productName} using available metadata.` }])
    } finally {
      clearTimeout(timeout)
      setSending(false)
    }
  }

  function onKeyDown(e){ if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); send() } }

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
            <div className="msg assistant"><div className="msg-bubble">Thinking…</div></div>
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
