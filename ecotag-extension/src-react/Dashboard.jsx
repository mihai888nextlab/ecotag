import React, { useState, useEffect } from 'react'
import './styles.css'
import logoUrl from '../public/logo.png'

function Ecoscore({ value = 78 }) {
  // value should be 0-100
  const angle = (value / 100) * 270 - 135 // map to -135..135 deg
  const stroke = 12
  const size = 160
  const radius = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2

  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="ecoscore-wrap" aria-hidden="false">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}> 
        <defs>
          <linearGradient id="g1" x1="0" x2="1">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <g transform={`translate(${cx}, ${cy})`} className="ecoscore-bg">
          <circle r={radius} fill="#fff" stroke="rgba(15,23,42,0.04)" strokeWidth="1" />
          <g transform="rotate(-135)">
            <path d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth={stroke} strokeLinecap="round" />
            {
              (() => {
                const arcLen = Math.PI * radius
                const shown = animated ? (value / 100) * arcLen : 0
                return (
                  <path
                    d={`M ${-radius} 0 A ${radius} ${radius} 0 0 1 ${radius} 0`}
                    fill="none"
                    stroke="url(#g1)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${shown} ${arcLen}`}
                    transform={`rotate(${angle})`}
                    style={{ transition: 'stroke-dasharray 900ms cubic-bezier(.2,.9,.2,1)' }}
                  />
                )
              })()
            }
          </g>
        </g>
      </svg>
      <div className="ecoscore-value">
        <div className="score">{value}</div>
        <div className="score-sub">ecoscore</div>
      </div>
    </div>
  )
}

function DashboardApp({ product = null, detecting = false, onRetry = () => {} }) {
  const [showRaw, setShowRaw] = useState(false)

  const priceText = (product && product.price && (product.price.amount || product.price.raw)) ? (product.price.amount || product.price.raw) : null
  const hasProduct = product && (product.title || product.sku || product.brand || priceText)

  return (
    <div className="dashboard-root">
      <div className="dashboard-container">
        <div className="dashboard-card">
          {detecting ? (
            <header className="dashboard-header">
              <div style={{width:'100%',textAlign:'center',padding:24}}>
                <div style={{fontWeight:700,fontSize:16}}>Detecting product on this page…</div>
                <div style={{color:'var(--muted)',marginTop:8}}>Please wait a moment — the page might be loading content.</div>
              </div>
            </header>
          ) : !hasProduct ? (
            <header className="dashboard-header">
              <div style={{width:'100%',textAlign:'center',padding:28}}>
                <div style={{fontWeight:800,fontSize:16}}>No product recognized on this page</div>
                <div style={{color:'var(--muted)',marginTop:8}}>The extension couldn't find product data (JSON-LD, meta tags or common product markup).</div>
                <div style={{marginTop:12,display:'flex',gap:8,justifyContent:'center'}}>
                  <button className="btn btn-primary" onClick={() => onRetry()}>Retry detection</button>
                  <button className="btn btn-ghost" onClick={() => window.open(location.href, '_blank')}>Open page</button>
                </div>
              </div>
            </header>
          ) : (
            <>
              <header className="dashboard-header">
                <Ecoscore value={(product && product.price && product.price.amount) ? 82 : 62} />
                <div className="product-title" aria-label="product-title">{product.title}</div>
              </header>

              <main className="dashboard-body">
                <section className="details">
                  <h2>Product</h2>
                  <ul>
                    <li><span className="detail-label">Brand</span><strong className="detail-value">{product.brand || '-'}</strong></li>
                    <li><span className="detail-label">Title</span><strong className="detail-value">{product.title || '-'}</strong></li>
                    <li><span className="detail-label">SKU</span><strong className="detail-value">{product.sku || '-'}</strong></li>
                    <li><span className="detail-label">Price</span><strong className="detail-value">{priceText || '-'}</strong></li>
                  </ul>

                  <div style={{marginTop:12,display:'flex',gap:8}}>
                    <button className="btn btn-ghost" onClick={() => setShowRaw(s => !s)}>{showRaw ? 'Hide raw' : 'Show raw'}</button>
                    <button className="btn btn-primary" onClick={() => window.open((product && product.url) || '#', '_blank')}>Open product page</button>
                  </div>

                  {showRaw && (
                    <pre style={{marginTop:12,whiteSpace:'pre-wrap',maxHeight:240,overflow:'auto',background:'#0f172a',color:'#e6eef6',padding:12,borderRadius:8}}>
                      {JSON.stringify(product || {}, null, 2)}
                    </pre>
                  )}

                  <div className="dashboard-meta">Updated: just now • Data: estimate</div>
                </section>
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardApp
