import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { InstallPwaDialog } from '@/components/install-pwa-dialog'
import { OfflineDetector } from '@/components/offline-detector'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  title: 'SAM - Video Sharing Platform',
  description: 'A modern video sharing platform with channels, categories, and trending content',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300 ease-in-out`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          themes={["dark", "light", "white", "pink"]}
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col overflow-x-hidden">
              {children}
            </div>
            <OfflineDetector />
            <InstallPwaDialog />
            <Toaster />
            <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="afterInteractive" />
            <Script id="register-sw" strategy="afterInteractive">
              {`
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(
                      function(registration) {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                      },
                      function(err) {
                        console.log('ServiceWorker registration failed: ', err);
                      }
                    );
                  });
                }
              `}
            </Script>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
