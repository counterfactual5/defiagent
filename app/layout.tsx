import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DeFi Agent — Live Web3 Analytics & Execution Tools',
  description: 'Open-source Web3 AI Agent suite on defiagent.llm.christmas. Swap quotes, liquidity analytics, Polymarket snapshots, and wallet security preflight.',
  icons: {
    icon: '/icon.svg',
  },
}

const themeBoot = `(function(){try{var t=localStorage.getItem('defiagent.theme.v1')||'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+SC:wght@400;500;600;700&family=Outfit:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
