import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { Navigation } from '@/components/navigation'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Prowider Mini Lead Distribution System',
  description: 'Next.js + PostgreSQL assignment solution for reliable lead allocation.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Navigation />
        <main className="shell page-frame">{children}</main>
      </body>
    </html>
  )
}
