import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Clairo – Smart Financial Management',
    template: '%s | Clairo',
  },
  description:
    'Take full control of your finances with real-time analytics, seamless payments, and intelligent insights. Track expenses, grow savings, and invest wisely — all in one platform.',
  keywords: [
    'personal finance app',
    'financial dashboard',
    'expense tracker',
    'savings tracker',
    'investment tracker',
    'money management',
    'budgeting app',
    'financial management',
    'cashflow analytics',
    'online banking dashboard',
  ],
  authors: [{ name: 'Clairo' }],
  creator: 'Clairo',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Clairo',
    title: 'Clairo – Smart Financial Management',
    description:
      'Take full control of your finances with real-time analytics, seamless payments, and intelligent insights. Track expenses, grow savings, and invest wisely.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Clairo – Smart Financial Management Dashboard',
      },
    ],
  },
  icons: {
    icon: '/logo-no-lable-no-bg.png',
    apple: '/logo-no-lable-no-bg.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clairo – Smart Financial Management',
    description:
      'Take full control of your finances with real-time analytics, seamless payments, and intelligent insights.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#3d8b5e',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
