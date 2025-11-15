import "@/styles/globals.css";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return <SessionProvider session={session}>
    <Header />
    <Component {...pageProps} />
    <Footer />
  </SessionProvider>;
}
