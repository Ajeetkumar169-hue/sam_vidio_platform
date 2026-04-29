"use client"

import { Home, Search, User, Grid3X3, Download } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MobileNavProps {
  onMoreClick: () => void
}

export function MobileNav({ onMoreClick }: MobileNavProps) {
  const pathname = usePathname()

  const tabs = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/downloads", label: "Downloads", icon: Download },
    { href: "/settings", label: "Profile", icon: User },
  ]

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] h-16 w-[90%] -translate-x-1/2 lg:hidden">
      <nav className="flex h-full w-full items-center justify-around rounded-full border border-foreground/10 glass-heavy px-4 shadow-2xl">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-1 transition-all duration-300 scale-bounce-100",
                isActive ? "text-primary active-upward-shift" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn(
                "h-5 w-5 transition-all",
                isActive && "active-glow"
              )} />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                {tab.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-2 h-1 w-3 rounded-full bg-primary animate-indicator-pill shadow-[0_0_8px_var(--primary)]" />
              )}
            </Link>
          )
        })}

        {/* More Tab */}
        <button
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground scale-bounce-100 hover:text-foreground transition-all"
        >
          <Grid3X3 className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
            More
          </span>
        </button>
      </nav>
    </div>
  )
}
