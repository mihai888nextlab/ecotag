import Link from 'next/link'
import styles from '../styles/Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.inner}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <Link href="/" className={styles.brand} aria-label="EcoTag home">
              <img src="/logo.png" alt="EcoTag" className={styles.logo} />
              <span className={styles.name}>EcoTag</span>
            </Link>
            <p className={styles.tagline}>Helping you scan and choose sustainable products.</p>
          </div>

          <div className={styles.col}>
            <h4>Resources</h4>
            <ul className={styles.list}>
              <li><Link href="/app/scanner" className={styles.link}>Scanner</Link></li>
              <li><Link href="/app/register" className={styles.link}>Get started</Link></li>
            </ul>
          </div>

          <div className={styles.col}>
            <h4>Connect</h4>
            <div className={styles.social}>
              <a href="https://github.com" aria-label="GitHub" className={styles.icon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.4 7.86 10.93.57.1.78-.25.78-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.25 3.32.95.1-.74.4-1.25.73-1.54-2.56-.29-5.26-1.28-5.26-5.71 0-1.26.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.95 10.95 0 0 1 2.87-.39c.97 0 1.95.13 2.87.39 2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.08 0 4.44-2.71 5.42-5.29 5.7.41.36.77 1.08.77 2.18 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.79.56A11.52 11.52 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
              </a>
              <a href="https://twitter.com" aria-label="Twitter" className={styles.icon}>🐦</a>
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <small className={styles.copy}>© {new Date().getFullYear()} EcoTag — Built for better choices</small>
        </div>
      </div>
    </footer>
  )
}
