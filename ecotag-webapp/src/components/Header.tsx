import Link from 'next/link'
import { useState } from 'react'
import styles from '../styles/Header.module.css'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  return (
    <header className={styles.header} role="banner">
      <div className={styles.inner}>
        <div className={styles.brandWrap}>
          <Link href="/" className={styles.brand} aria-label="EcoTag home">
            <img src="/logo.png" alt="EcoTag" className={styles.logo} />
            <span className={styles.name}>EcoTag</span>
          </Link>
        </div>

        <button
          className={styles.mobileToggle}
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 1h20M0 7h20M0 13h20" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <nav className={`${styles.nav} ${open ? styles.open : ''}`} aria-label="Main navigation">
          <Link href="/app/scanner" className={styles.link}>Scanner</Link>
          <Link href="/app/app" className={styles.link}>Dashboard</Link>
          <Link href="/app/register" className={styles.cta}>Get started</Link>
          <button
            className={styles.themeToggle}
            onClick={() => setDark(d => !d)}
            aria-pressed={dark}
            aria-label="Toggle theme"
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </nav>
      </div>
    </header>
  )
}
