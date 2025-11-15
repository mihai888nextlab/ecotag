import React, { useState, useEffect } from 'react'
import './styles.css'
import logoUrl from '../public/logo.png'
import Assistant from './Assistant'

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
          {
            (() => {
              // full circumference of the circle
              const circumference = 2 * Math.PI * radius
              const shown = animated ? (value / 100) * circumference : 0
              return (
                <>
                  {/* background ring (subtle) */}
                  <circle r={radius} fill="none" stroke="rgba(15,23,42,0.06)" strokeWidth={stroke} strokeLinecap="round" transform={`rotate(90)`} />
                  {/* foreground arc: rotate so the stroke starts at bottom-center (90deg) */}
                  <circle
                    r={radius}
                    fill="none"
                    stroke="url(#g1)"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={`${shown} ${Math.max(0, circumference - shown)}`}
                    transform={`rotate(90)`}
                    style={{ transition: 'stroke-dasharray 900ms cubic-bezier(.2,.9,.2,1)' }}
                  />
                </>
              )
            })()
          }
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
          <div style={{position:'absolute',top:12,right:12,display:'flex',gap:8,alignItems:'center'}}>
            <button className={"refresh-icon" + (detecting ? ' spinning' : '')} onClick={() => onRetry()} aria-label="Refresh detection" title="Refresh detection" disabled={detecting}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M21 12a9 9 0 10-2.47 6.03" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

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
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
                  <div>
                    <div className="product-title" aria-label="product-title">{product.title}</div>
                    <div className="product-sub">{product.brand || ''}</div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                  </div>
                </div>
              </header>

              <main className="dashboard-body">
                <section className="details">
                  <h2>Product</h2>
                  <ul>
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

                  {/* compact UI: hide verbose metadata in popup */}
                </section>

                {/* Materials section: separate from Product details */}
                {product.materials && product.materials.length > 0 && (
                  <section className="details" style={{marginTop:12}}>
                    <h2>Materials</h2>
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>
                      {product.materials.map((m, i) => (
                        <span key={i} className="material-chip">{m}</span>
                      ))}
                    </div>
                  </section>
                )}
              </main>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardApp
