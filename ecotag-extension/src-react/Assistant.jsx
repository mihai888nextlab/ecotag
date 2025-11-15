import React, { useState, useRef, useEffect } from 'react'
import './styles.css'
import './assistant-styles.css'

// Minimal assistant UI that posts to http://localhost:3000/api/gemini
export default function Assistant({ product, onChatStartedChange } = {}){
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  // start with no assistant message so the UI shows product + example chips as the starting screen
  const [messages, setMessages] = useState([])
  const listRef = useRef(null)
  // whether the chat has been started by the user (used to hide the starting example chips)
  const chatStarted = messages.some(m => m.role === 'user')
  // productData will hold the product info; prefer prop but fetch from content-script if missing
  const [productData, setProductData] = useState(product || null)

  useEffect(() => {
    // If no product prop was provided, query the active tab and send the message to the
    // content script in that tab. This reliably reaches the page script from the popup.
    if ((!productData || !productData.title) && typeof chrome !== 'undefined' && chrome && chrome.tabs && chrome.tabs.query){
      try{
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (!tabs || !tabs.length) return
          const tabId = tabs[0].id
          if (!tabId) return
          chrome.tabs.sendMessage(tabId, { action: 'getProduct' }, (resp) => {
            // runtime.lastError can be set if the tab has no listener
            if (chrome.runtime && chrome.runtime.lastError){
              // no content script listener in active tab
              // console.debug('No content script or listener in tab', chrome.runtime.lastError)
              return
            }
            if (resp && resp.ok && resp.product) setProductData(resp.product)
          })
        })
      }catch(e){/* ignore in non-extension or if APIs unavailable */}
    }
  }, [])

  useEffect(() => { scrollToBottom() }, [messages])

  // notify parent about chatStarted changes so the popup can resize
  useEffect(() => {
    try {
      if (typeof onChatStartedChange === 'function') onChatStartedChange(chatStarted)
    } catch (e) { /* ignore */ }
  }, [chatStarted])

  function scrollToBottom(){
    try{ if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }catch(e){}
  }

  async function send(overrideText){
  const raw = overrideText ?? input
  const text = (raw || '').trim()
    if (!text || sending) return
    const userMsg = { id: Date.now(), role: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setSending(true)

    const url = 'http://localhost:3000/api/gemini'

    // Build a compact prompt that includes the user's question and a short product summary
    const productParts = []
    const p = productData || product || null
    if (p){
      if (p.title) productParts.push(`Title: ${p.title.split('\n')[0]}`)
      if (p.brand) productParts.push(`Brand: ${p.brand}`)
      if (p.sku) productParts.push(`SKU: ${p.sku}`)
      if (p.price && (p.price.amount || p.price.raw)) productParts.push(`Price: ${p.price.amount || p.price.raw}${p.price.currency ? ' ' + p.price.currency : ''}`)
    }
    const productSummary = productParts.length ? `Product info:\n${productParts.join('\n')}` : ''
    const preprompt = `You are the EcoTag Assistant — an expert in apparel & accessory sustainability.

IMPORTANT — use product data ONLY when requested/required:
- NEVER use the provided product metadata (Title, Brand, SKU, Price) to answer a user's question unless the user explicitly references the product or the question explicitly requires that metadata. Examples when using the product is allowed: "Based on this product, is the price fair?" or "Does this product list materials?". If the product is not mentioned or is not relevant to the question, IGNORE the product metadata entirely.
- Do NOT invent product-specific facts or apply product fields to unrelated questions. If you lack information, say so (see "Unknowns" rule below).

Answer style and strict length rules:
- Always answer concisely and clearly. Start with a 1-sentence summary whenever possible. Use up to 3 short sentences only when needed for clarity.
- After the summary, include up to 5 very short bullet points (prefer <=12 words each) under these headings when applicable: Materials; Origin/production country; Certifications or labels; Environmental & ethical considerations; Practical user advice.
- Unknowns: If a field is missing or unknown, state one short assumption prefixed with "Assumption:". If you cannot answer, write exactly: "Insufficient data to determine." (do not guess).
- End with a one-word confidence tag on its own line: High / Medium / Low.

Tone and style: friendly, professional, direct. Avoid marketing language. Prefer actionable, concrete statements.
Output (strict): Summary (1 sentence preferred, max 3 sentences), a bulleted list (max 5 short items), then a one-word confidence tag on its own line.`
    const combinedPrompt = [preprompt, text, productSummary].filter(Boolean).join('\n\n')

    // timeout via AbortController
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try{
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // gemini.ts expects { prompt: string }
        body: JSON.stringify({ prompt: combinedPrompt }),
        signal: controller.signal
      })
      clearTimeout(timeout)
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      const j = await resp.json()
      // Next.js API returns { response: generatedText }
      const replyText = (j && (j.response || j.reply || j.result || j.output)) || 'No reply content.'
      const normalized = typeof replyText === 'string' ? replyText : JSON.stringify(replyText)
      setMessages(m => [...m, { id: Date.now()+1, role: 'assistant', text: normalized }])
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

      {/* product summary badge / mini-card (thumbnail + details) */}
      {productData && (
        <div className="product-summary" title={productData.title || ''}>
          {productData.images && productData.images[0] ? (
            <img
              className="ps-thumb"
              src={productData.images[0]}
              alt={productData.title ? productData.title.split('\n')[0] : 'product'}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : null}
          <div className="ps-body">
            <div className="ps-title">{productData.title}</div>
            <div className="ps-meta">
              {productData.brand ? <span className="ps-chip">Brand: {productData.brand}</span> : null}
              {productData.sku ? <span className="ps-chip">SKU: {productData.sku}</span> : null}
              {productData.price && (productData.price.amount || productData.price.raw) ? (
                <span className="ps-chip">Price: {productData.price.amount || productData.price.raw}{productData.price.currency ? ' ' + productData.price.currency : ''}</span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* example quick-questions (click to send) - shown only on the starting screen
          Rendered under the product summary so it visually ties to the product card. */}
      {!chatStarted && (
        <div className="assistant-examples">
        {[
          'What materials is this likely made from?',
          'How should I wash this garment?',
          'Is the price reasonable for this brand?',
          'What certifications should I look for?'
        ].map((ex, i) => (
          <button key={i} className="example-chip" onClick={() => send(ex)}>{ex}</button>
        ))}
        </div>
      )}

      <div className="assistant-body">
        {/* dynamic input placement:
            - when chat is empty (no user messages) show input above the message list (near product/examples)
            - when chat has started show input below the message list */}
        {!chatStarted && (
          <div className="assistant-input-row">
            <textarea
              className="assistant-input"
              placeholder="Ask a question about this product…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
            />
            <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || sending} aria-disabled={!input.trim() || sending}>
              {sending ? 'Sending…' : 'Ask'}
            </button>
          </div>
        )}

        <div ref={listRef} className="assistant-messages" aria-live="polite">
          {messages.map(m => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="msg-bubble">
                <div className="msg-meta">
                  <span className="msg-role">{m.role === 'user' ? 'You' : 'Assistant'}</span>
                </div>
                <div className="msg-text">
                  {String(m.text || '').split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className="msg assistant"><div className="msg-bubble"><div className="msg-meta"><span className="msg-role">Assistant</span></div><div className="msg-text">Thinking…</div></div></div>
          )}
        </div>

        {chatStarted && (
          <div className="assistant-input-row">
            <textarea
              className="assistant-input"
              placeholder="Ask a question about this product…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
            />
            <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || sending} aria-disabled={!input.trim() || sending}>
              {sending ? 'Sending…' : 'Ask'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
