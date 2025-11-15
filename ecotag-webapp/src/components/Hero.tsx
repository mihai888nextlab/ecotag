import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from '../styles/Hero.module.css'

export default function Hero() {
  const [step, setStep] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [entered, setEntered] = useState(false)
  const [barMoving, setBarMoving] = useState(false)
  const [processing, setProcessing] = useState(false)
  // controls whether the phone-fixed red line is visible; once hidden after processing it stays hidden
  const [codebarVisible, setCodebarVisible] = useState(true)
  const [productTitle, setProductTitle] = useState<string | null>(null)

  const steps = [
    'Open the scanner',
    'Point at the barcode',
    'Get eco information',
  ]

  function startScan() {
    setResult(null)
    // begin animated barcode fly-in
    setBarMoving(true)
    setProcessing(false)
    // ensure the phone-fixed red line is visible when a new scan starts
    setCodebarVisible(true)
    setScanning(true)
    setStep(1)
  }

  function onBarArrived() {
    // barcode has flown in front of phone, start processing/loading
    setBarMoving(false)
    // hide the phone's fixed red line when loading starts and keep it hidden afterwards
    setCodebarVisible(false)
    setProcessing(true)
    setStep(2)
    // simulate processing/loading then show result (slightly slower for clarity)
    setTimeout(() => {
      setProcessing(false)
      setScanning(false)
      setStep(3)
      // set product title and result details
      setProductTitle('Black Tshirt')
      setResult('100% Cotton')
      // do NOT restore the codebar line; it should remain hidden after loading
    }, 1800)
  }

  // when result appears, we can show the product artwork inside the phone
  // no extra state required — render when `result` is set

  useEffect(() => {
    // entrance animation trigger
    const t = setTimeout(() => setEntered(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <section className={`${styles.hero} ${entered ? styles.entered : ''}`} aria-labelledby="hero-heading">
      <div className={styles.content}>
        <h1 id="hero-heading" className={styles.title}>Scan. Learn. Choose better.</h1>
        <p className={styles.lead}>
          EcoTag helps you uncover product sustainability by scanning barcodes. Fast, private,
          and focused on simple, useful info.
        </p>

        <ol className={styles.steps} aria-hidden={false}>
          {steps.map((s, i) => (
            // highlight only the current step (reflects the animation action)
            <li key={s} className={`${i + 1 === step ? styles.stepActive : ''} ${entered ? styles.stepEnter : ''}`}>
              <span className={styles.stepIndex}>{i + 1}</span>
              <span className={styles.stepText}>{s}</span>
            </li>
          ))}
        </ol>

        <div className={styles.actions}>
          <button className={styles.scanButton} onClick={startScan} aria-pressed={scanning}>
            {scanning ? 'Scanning...' : 'Open Scanner'}
          </button>
          {result && <div className={styles.result} role="status" aria-live="polite">{result}</div>}
        </div>
      </div>

      <div className={`${styles.device} ${entered ? styles.deviceEnter : ''}`} aria-hidden="true">
        <div className={`${styles.phone} ${scanning ? styles.phoneScan : ''}`}>
          <div className={styles.cameraStub} />
            <div className={styles.screen}>
            {/* fixed red horizontal line on the phone (visible from the start) - hide while processing */}
            <div className={`${styles.codebarLine} ${barMoving ? styles.codebarActive : ''} ${!codebarVisible ? styles.codebarHidden : ''}`} />

            {/* flying barcode animation (uses public /codebar.png) */}
            {barMoving && (
              // onAnimationEnd triggers when CSS animation completes
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/codebar.png" alt="barcode" className={styles.flyingBarcode} onAnimationEnd={onBarArrived} />
            )}
            <div className={`${styles.scanLine} ${scanning || processing ? styles.scanning : ''}`} />
            {processing && <div className={styles.processing} aria-hidden>
              <div className={styles.loader} />
            </div>}
            {result && (
              <>
                {/* show tshirt artwork inside the phone once result is ready */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/tshirt.png" alt={productTitle ?? 'product'} className={styles.productImage} />
                <div className={styles.overlay}>{productTitle ?? 'Product'}</div>
              </>
            )}
          </div>
        </div>
      </div>
      </section>

      <section className={styles.solutions} aria-labelledby="solutions-heading">
        <div className={styles.solutionsInner}>
          <h2 id="solutions-heading" className={styles.solutionsTitle}>Two ways we help you shop sustainably</h2>

          <p className={styles.solutionsLead}>EcoTag works both when you browse online and when you shop in person — pick whichever fits your flow.</p>

          <div className={styles.solutionGrid}>
            <div className={styles.card}>
              <div className={styles.icon} aria-hidden>
                🧩
              </div>
              <h3 className={styles.cardTitle}>Online shopping — browser extensions</h3>
              <p className={styles.cardDesc}>When you browse e-commerce sites, our browser extensions surface sustainability scores and alternatives inline — so you can make better choices without leaving the page.</p>
              <Link href="/app" className={styles.cardCta}>Install extension</Link>
            </div>

            <div className={styles.card}>
              <div className={styles.icon} aria-hidden>
                📦
              </div>
              <h3 className={styles.cardTitle}>Physical shopping — on-the-go scanner</h3>
              <p className={styles.cardDesc}>Use the web scanner on your phone to scan a barcode in-store and get instant eco information: materials, recycling, and better alternatives.</p>
              <Link href="/app/scanner" className={styles.cardCta}>Open scanner</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.problem} aria-labelledby="problem-heading">
        <div className={styles.problemInner}>
          <div className={styles.problemGrid}>
            <div className={styles.problemText}>
              <h2 id="problem-heading" className={styles.problemTitle}>The problem we solve</h2>
              <p className={styles.problemLead}>Quick, consistent eco information is missing at the moment you shop — online or in-store.</p>

              <div className={styles.pointTiles}>
                <div className={styles.tile}>
                  <div className={styles.tileIcon} aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.35-4.35" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="6" stroke="#0b6b4f" strokeWidth="1.6"/></svg>
                  </div>
                  <div className={styles.tileBody}>
                    <div className={styles.tileTitle}>Hidden details</div>
                    <div className={styles.tileSub}>Materials, origin and recyclability hidden in product pages.</div>
                  </div>
                </div>

                <div className={styles.tile}>
                  <div className={styles.tileIcon} aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 14a5 5 0 0 1 0-7l3-3" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 10a5 5 0 0 1 0 7l-3 3" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className={styles.tileBody}>
                    <div className={styles.tileTitle}>Scattered sources</div>
                    <div className={styles.tileSub}>Comparisons require multiple tabs and guesswork.</div>
                  </div>
                </div>

                <div className={styles.tile}>
                  <div className={styles.tileIcon} aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="14" height="18" rx="2" stroke="#0b6b4f" strokeWidth="1.6"/><path d="M7 7h6" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round"/><path d="M11 16h2" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round"/></svg>
                  </div>
                  <div className={styles.tileBody}>
                    <div className={styles.tileTitle}>Slow in-store checks</div>
                    <div className={styles.tileSub}>Scanning should be instant and private.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.problemVisual} aria-hidden="true">
              <div className={styles.visualStack}>
                <div className={styles.visualItem}>
                  {/* magnifier + sheet visual */}
                  <svg viewBox="0 0 120 96" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="6" width="70" height="52" rx="6" fill="#fff" stroke="#e6f5ee"/>
                    <rect x="14" y="14" width="54" height="10" rx="3" fill="#e8fff3"/>
                    <rect x="14" y="30" width="36" height="8" rx="3" fill="#f6fff8"/>
                    <circle cx="96" cy="66" r="18" fill="#e8fff3" stroke="#dff9ef"/>
                    <path d="M104 74l-12-12" stroke="#0b6b4f" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="96" cy="66" r="6" fill="#0b6b4f"/>
                  </svg>
                </div>

                <div className={styles.visualItem}>
                  {/* network / chain visual */}
                  <svg viewBox="0 0 120 96" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <rect x="6" y="16" width="36" height="36" rx="6" fill="#fff" stroke="#e6f5ee"/>
                    <rect x="78" y="16" width="36" height="36" rx="6" fill="#fff" stroke="#e6f5ee"/>
                    <path d="M42 34h36" stroke="#dff9ef" strokeWidth="3" strokeLinecap="round"/>
                    <circle cx="24" cy="34" r="8" fill="#e8fff3" stroke="#dff9ef"/>
                    <circle cx="96" cy="34" r="8" fill="#e8fff3" stroke="#dff9ef"/>
                    <path d="M24 42v18" stroke="#dff9ef" strokeWidth="2"/>
                    <path d="M96 42v18" stroke="#dff9ef" strokeWidth="2"/>
                  </svg>
                </div>

                <div className={styles.visualItem}>
                  {/* phone + barcode visual */}
                  <svg viewBox="0 0 120 96" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <rect x="40" y="10" width="42" height="70" rx="8" fill="#fff" stroke="#e6f5ee"/>
                    <rect x="48" y="20" width="26" height="8" rx="2" fill="#e8fff3"/>
                    <g fill="#111">
                      <rect x="50" y="36" width="2" height="18"/>
                      <rect x="54" y="36" width="1" height="18"/>
                      <rect x="57" y="36" width="3" height="18"/>
                      <rect x="63" y="36" width="1" height="18"/>
                      <rect x="66" y="36" width="2" height="18"/>
                      <rect x="70" y="36" width="1" height="18"/>
                    </g>
                    <circle cx="44" cy="78" r="6" fill="#e8fff3" stroke="#dff9ef"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
