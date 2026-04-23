import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Press_Start_2P } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-pixel" })

export const metadata: Metadata = {
  title: "Douwe's Super Megalomane WK Pool 2026",
  description: "Voorspel de WK 2026 wedstrijden en win de pool!",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${geist.variable} ${pressStart.variable} h-full`}>
      {/* Anti-FOUC: apply saved theme before first paint */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('wk-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();` }} />
      </head>
      <body className="min-h-full flex flex-col bg-pitch font-sans" style={{ WebkitFontSmoothing: "none", MozOsxFontSmoothing: "unset" }}>
        {children}
      </body>
    </html>
  )
}
