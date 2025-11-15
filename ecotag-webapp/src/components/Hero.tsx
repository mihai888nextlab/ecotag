import React, { useState } from 'react'
import styles from '../styles/Hero.module.css'

export default function Hero() {
  const [step, setStep] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const steps = [
    'Open the scanner',
    'Point at the barcode',
    'Get eco information',
  ]

  function startScan() {
    setResult(null)
    setScanning(true)
    setStep(1)
    // simulate scanning progress
    setTimeout(() => setStep(2), 700)
    setTimeout(() => {
      setScanning(false)
      setStep(3)
      setResult('Recycled Paper Towels — 85% recycled fibers')
    }, 2000)
  }

  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      {/* decorative t-shirt behind the hero, low-opacity */}
      <svg className={styles.deco} viewBox="0 0 200 200" aria-hidden="true">
        <g fill="#0b6b4f">
          <path d="M60 20c0 0-6 0-12 6s-6 8-6 14 2 12 6 14 10 6 16 10 10 6 10 6v60h20V80s4-2 10-6 12-6 16-10 6-10 6-14-2-10-6-14-12-6-12-6l-8 6s-6-6-14-6-14 6-14 6l-8-6z"/>
        </g>
      </svg>
      <div className={styles.content}>
        <h1 id="hero-heading" className={styles.title}>Scan. Learn. Choose better.</h1>
        <p className={styles.lead}>
          EcoTag helps you uncover product sustainability by scanning barcodes. Fast, private,
          and focused on simple, useful info.
        </p>

        <ol className={styles.steps} aria-hidden={false}>
          {steps.map((s, i) => (
            <li key={s} className={i + 1 <= step ? styles.stepActive : ''}>
              <span className={styles.stepIndex}>{i + 1}</span>
              <span className={styles.stepText}>{s}</span>
            </li>
          ))}
        </ol>

        <div className={styles.actions}>
          <button className={styles.scanButton} onClick={startScan} aria-pressed={scanning}>
            {scanning ? 'Scanning...' : 'Open Scanner'}
          </button>
          {result && <div className={styles.result} role="status">{result}</div>}
        </div>
      </div>

      <div className={styles.device} aria-hidden="true">
        <div className={styles.phone}>
          <div className={styles.cameraStub} />
          <div className={styles.screen}>
            <div className={styles.barcode} />
            <div
              className={`${styles.scanLine} ${scanning ? styles.scanning : ''}`}
            />
            {result && <div className={styles.overlay}>{result.split('—')[0]}</div>}
          </div>
        </div>
      </div>
    </section>
  )
}
