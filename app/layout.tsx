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
    'Take control of your finances with real-time analytics, seamless payments, and intelligent insights. Track expenses, grow savings, and invest wisely.',
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
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Clairo – Smart Financial Management Dashboard',
      },
    ],
  },
  icons: {
    icon: '/favicon_io/favicon.ico',
    apple: '/clairo-logo.svg',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clairo – Smart Financial Management',
    description:
      'Take full control of your finances with real-time analytics, seamless payments, and intelligent insights.',
    images: ['/opengraph-image.png'],
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
  themeColor: '#032e6d',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).origin : ''

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {supabaseHost && <link rel="preconnect" href={supabaseHost} />}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
