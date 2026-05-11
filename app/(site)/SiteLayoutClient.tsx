"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { MobileNav } from "@/components/mobile-nav"

export default function SiteLayoutClient({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex flex-col min-h-screen">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 pt-16 md:pt-20">
        {children}
      </main>
      <MobileNav />
    </div>
  )
}
