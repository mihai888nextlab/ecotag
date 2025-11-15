import Link from 'next/link'
import { useState } from 'react'
import styles from '../styles/Header.module.css'
import { useRouter } from 'next/router'
import { useSession, signOut } from 'next-auth/react'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  const inApp = router.pathname.startsWith('/app')

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
          {inApp ? (
            // App-specific nav: mimic app/index.tsx navbar and show auth status
            <>
              <Link href="/app" className={styles.link}>Dashboard</Link>
              <Link href="/app/scanner" className={styles.link}>My Scans</Link>
              <Link href="/app/extension" className={styles.link}>Extension</Link>
              <Link href="/app/settings" className={styles.link}>Settings</Link>

              {status === 'authenticated' ? (
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span className={styles.link} style={{fontWeight:600}}>Hello, {session?.user?.email ?? session?.user?.name}</span>
                  <button className={styles.cta} onClick={() => signOut({ callbackUrl: '/' })}>Logout</button>
                </div>
              ) : (
                <div style={{display:'flex', gap:8}}>
                  <Link href="/app/register" className={styles.cta}>Sign up</Link>
                  <Link href="/app/login" className={styles.link}>Log in</Link>
                </div>
              )}
            </>
          ) : (
            // Public site nav
            <>
              <Link href="/app/scanner" className={styles.link}>Scanner</Link>
              <Link href="/app" className={styles.link}>Dashboard</Link>
              <Link href="/app/register" className={styles.cta}>Get started</Link>
              <button
                className={styles.themeToggle}
                onClick={() => setDark(d => !d)}
                aria-pressed={dark}
                aria-label="Toggle theme"
              >
                {dark ? '🌙' : '☀️'}
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
