import React, { useState, useEffect } from 'react'
import DashboardApp from './Dashboard'
import Assistant from './Assistant'
import logoUrl from '../public/logo.png'

export default function App() {
  const [view, setView] = useState('home')
  const [accepted, setAccepted] = useState(null) // null = unknown, false = not accepted, true = accepted
  const [detectedProduct, setDetectedProduct] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [showAssistant, setShowAssistant] = useState(false)
  // Increased sizes to avoid internal scrollbars and provide space for inputs.
  const homeSize = { width: 420, height: 340, overflow: 'hidden' }
  // Reduced dashboard height so the popup fits without large empty space
  const dashboardSize = { width: 520, height: 640, overflow: 'hidden' }

  // Resize helper: Chrome popup can grow but sometimes doesn't shrink automatically.
  // To force a shrink when switching to a smaller view, briefly set the document
  // size to 1x1 then to target size so the browser recalculates the popup bounds.
  function setPopupSize(width, height) {
    try {
      const docEl = document.documentElement
      // If shrinking, do a brief collapse first
      const currentWidth = parseInt(docEl.style.width || docEl.clientWidth || '0', 10)
      const currentHeight = parseInt(docEl.style.height || docEl.clientHeight || '0', 10)
      const shrinking = (width < currentWidth) || (height < currentHeight)
      if (shrinking) {
        docEl.style.width = '1px'
        docEl.style.height = '1px'
        // allow browser time to recalc
        window.setTimeout(() => {
          docEl.style.width = width + 'px'
          docEl.style.height = height + 'px'
        }, 60)
      } else {
        docEl.style.width = width + 'px'
        docEl.style.height = height + 'px'
      }
    } catch (e) {
      // ignore — best-effort
    }
  }

  useEffect(() => {
    // ensure initial popup size is set when component mounts
    setPopupSize(homeSize.width, homeSize.height)

    // Check one-time Terms acceptance. Use chrome.storage.local when available, otherwise fallback to localStorage.
    try {
      if (window.chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.get === 'function') {
        chrome.storage.local.get({ acceptedTerms: false }, (res) => {
          const ok = !!(res && res.acceptedTerms)
          setAccepted(ok)
          if (ok) {
            // Delay slightly to allow popup initial layout before switching to larger dashboard
            setTimeout(() => setView('dashboard'), 120)
          }
        })
      } else {
        const ok = !!(window.localStorage && window.localStorage.getItem && window.localStorage.getItem('ecotag.acceptedTerms'))
        setAccepted(ok)
        if (ok) {
          setTimeout(() => setView('dashboard'), 120)
        }
      }
    } catch (e) {
      // if storage check fails, default to not accepted so user sees T&C
      setAccepted(false)
    }
  }, [])

  useEffect(() => {
    // update popup size whenever the view changes
    if (view === 'dashboard') {
      setPopupSize(dashboardSize.width, dashboardSize.height)
      // when opening the dashboard, request the product info from the active tab
      requestProductFromActiveTab()
    } else setPopupSize(homeSize.width, homeSize.height)
  }, [view])

  // request product info from the active tab and set state
  function requestProductFromActiveTab(){
    if (detecting) return
    setDetecting(true)
    setDetectedProduct(null)
    if (!window.chrome || !chrome.tabs || !chrome.runtime){
      // not running in extension environment; can't request
      setDetecting(false)
      return
    }
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0]
        if (!tab || !tab.id){ setDetecting(false); return }
        // If the active tab is a chrome:// or other internal page, don't try to message it.
        const url = tab.url || ''
        const allowed = /^https?:\/\//i.test(url) || /^file:\/\//i.test(url)
        if (!allowed) {
          // can't access internal or extension pages
          setDetectedProduct(null)
          setDetecting(false)
          return
        }

        try {
          chrome.tabs.sendMessage(tab.id, { action: 'getProduct' }, (response) => {
            if (chrome.runtime.lastError){
              // content script might not be injected on some pages (or blocked)
              // silently fail and allow the background injection flow to try again.
              console.debug('sendMessage error', chrome.runtime.lastError && chrome.runtime.lastError.message)
              setDetectedProduct(null)
              setDetecting(false)
              return
            }
            if (response && response.ok && response.product){
              setDetectedProduct(response.product)
            } else {
              setDetectedProduct(null)
            }
            setDetecting(false)
          })
        } catch (e) {
          // defensive: catch synchronous exceptions (shouldn't normally happen)
          console.debug('requestProductFromActiveTab exception', e)
          setDetectedProduct(null)
          setDetecting(false)
        }
      })
    } catch (e){
      setDetecting(false)
    }
  }

  // listen for proactive productUpdated messages from content scripts
  useEffect(() => {
    if (!window.chrome || !chrome.runtime || !chrome.runtime.onMessage) return
    const handler = (msg, sender) => {
      if (!msg || !msg.action) return
      // product updates come from content scripts — ensure they match the active tab
      if (msg.action === 'productUpdated'){
        try {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs && tabs[0]
            if (!tab) return
            if (sender && sender.tab && sender.tab.id === tab.id) {
              setDetectedProduct(msg.product)
              setDetecting(false)
            }
          })
        } catch (e) {
          // ignore
        }
        return
      }

      // background notifies when active tab changed; re-request product from new active tab
      if (msg.action === 'activeTabChanged'){
        try { requestProductFromActiveTab() } catch (e) {}
        return
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [])

  if (view === 'dashboard') {
    return (
      <div className={`popup-root ${view === 'dashboard' ? 'is-dashboard' : ''}`} style={dashboardSize}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div className="brand">
            <div className="logo" aria-hidden="true">
              <img src={logoUrl} alt="ecotag logo" />
            </div>
            <div>
              <h1 className="title">ecotag</h1>
              <p className="subtitle">Simple. Trustworthy. Minimal.</p>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button
              className={"assistant-global-toggle" + (showAssistant ? ' active' : '')}
              onClick={() => setShowAssistant(s => !s)}
              title={showAssistant ? 'Return to dashboard' : 'Open assistant'}
              aria-pressed={showAssistant}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
          <div style={{ marginTop: 8 }}>
          {showAssistant ? (
            <Assistant />
          ) : (
            <DashboardApp product={detectedProduct || null} detecting={detecting} onRetry={requestProductFromActiveTab} />
          )}
        </div>
        {/* footer removed to keep popup compact */}
      </div>
    )
  }
  // Home / Terms view
  function acceptTermsAndOpenDashboard(){
    try{
      if (window.chrome && chrome.storage && chrome.storage.local && typeof chrome.storage.local.set === 'function'){
        chrome.storage.local.set({ acceptedTerms: true }, () => {
          setAccepted(true)
          // delay to let popup resize smoothly
          setTimeout(() => setView('dashboard'), 80)
        })
      } else if (window.localStorage && window.localStorage.setItem){
        window.localStorage.setItem('ecotag.acceptedTerms', '1')
        setAccepted(true)
        setTimeout(() => setView('dashboard'), 80)
      } else {
        // fallback
        setAccepted(true)
        setTimeout(() => setView('dashboard'), 80)
      }
    }catch(e){
      setAccepted(true)
      setTimeout(() => setView('dashboard'), 80)
    }
  }

  return (
    <div className={`popup-root ${view === 'dashboard' ? 'is-dashboard' : ''}`} style={homeSize}>
      <header className="popup-header">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            <img src={logoUrl} alt="ecotag logo" />
          </div>
          <div>
            <h1 className="title">ecotag</h1>
            <p className="subtitle">Simple. Trustworthy. Minimal.</p>
          </div>
        </div>
      </header>

      <main className="popup-body">
        {accepted === null ? (
          <p className="lead">Checking preferences…</p>
        ) : accepted === true ? (
          <p className="lead">Opening dashboard…</p>
        ) : (
          <>
            <h2>Terms & Conditions</h2>
            <p className="lead">Please accept the terms and conditions to use ecotag. We do not send page data to external servers by default.</p>
            <div style={{marginTop:12}}>
              <button className="btn btn-primary" onClick={acceptTermsAndOpenDashboard}>Accept & Open dashboard</button>
              <button className="btn btn-ghost" onClick={() => window.open('https://example.com', '_blank')}>Learn more</button>
            </div>
          </>
        )}
      </main>

      {/* footer removed to keep popup compact */}
    </div>
  )
}
