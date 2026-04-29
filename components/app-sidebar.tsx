"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  Home,
  TrendingUp,
  Clock,
  ThumbsUp,
  Grid3X3,
  Users,
  Upload,
  Settings,
  LogIn,
  Film,
  Shield,
  LayoutDashboard,
  LogOut,
  Pin,
  PinOff,
  History,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Category {
  _id?: string
  id?: string
  name: string
  slug: string
}

interface AppSidebarProps {
  open: boolean
  pinned?: boolean
  onTogglePin?: () => void
  onClose: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function AppSidebar({ open, pinned, onTogglePin, onClose, onMouseEnter, onMouseLeave }: AppSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) setCategories(d.categories)
      })
      .catch(() => { })
  }, [])

  const mainLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/trending", label: "Trending", icon: TrendingUp },
    { href: "/latest", label: "Latest", icon: Clock },
    { href: "/top-rated", label: "Top Rated", icon: ThumbsUp },
    { href: "/categories", label: "All Categories", icon: Grid3X3 },
    { href: "/chat", label: "Global Chat", icon: MessageCircle },
  ]



  const userLinks = user
    ? [
      { href: "/subscriptions/videos", label: "Subscriptions", icon: Users },
      { href: "/history", label: "History", icon: History },
      { href: `/channel/${user.channel?.slug || user.username}`, label: "My Channel", icon: Film },
      { href: "/upload", label: "Upload Video", icon: Upload },
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/settings", label: "Settings", icon: Settings },
    ]
    : []

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "fixed left-0 top-0 z-50 hidden h-full w-64 flex-col glass-heavy border-r-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex",
        open || pinned
          ? "translate-x-0 opacity-100 blur-none pointer-events-auto shadow-2xl" 
          : "-translate-x-12 opacity-0 blur-md pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-foreground/5 bg-gradient-to-r from-primary/10 to-transparent">
        <Link href="/" className="logo-text text-2xl tracking-tighter" data-text="SAM">
          SAM
        </Link>
        {onTogglePin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "h-8 w-8 rounded-lg transition-all duration-300",
            pinned ? "text-primary bg-primary/10" : "text-foreground/20 hover:text-foreground hover:bg-foreground/5"
            )}
            onClick={onTogglePin}
            title={pinned ? "Unpin Sidebar" : "Pin Sidebar"}
          >
            {pinned ? <Pin className="h-4 w-4 fill-current rotate-45" /> : <PinOff className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 platinum-scrollbar space-y-10">
        {/* Main Navigation */}
        <section>
          <nav className="flex flex-col gap-1.5">
            {mainLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                     isActive
                      ? "bg-foreground/10 text-foreground shadow-sm"
                      : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {isActive && <div className="active-indicator-line rounded-full" />}
                  <link.icon className={cn(
                    "h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                    isActive && "active-glow"
                  )} />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </section>

        {/* User Links (Studio & Subscriptions) */}
        {user && (
          <section>
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/20">
              Studio
            </p>
            <nav className="flex flex-col gap-1.5">
              {userLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <div key={link.href} className="flex flex-col">
                    <Link
                      href={link.href}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                      isActive
                          ? "bg-foreground/10 text-foreground shadow-sm"
                          : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                      )}
                    >
                      {isActive && <div className="active-indicator-line rounded-full" />}
                      <link.icon className={cn(
                        "h-4 w-4 flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
                        isActive && "active-glow"
                      )} />
                      <span className="flex-1">{link.label}</span>
                      
                    </Link>
                  </div>
                )
              })}
            </nav>
          </section>
        )}

        {/* Admin Link */}
        {user?.role === "admin" && (
            <section>
                 <Link
                    href="/admin"
                    className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
                  >
                    <Shield className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                    Admin Console
                  </Link>
            </section>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <section>
            <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[0.3em] text-foreground/20">
              Explore
            </p>
            <nav className="flex flex-col gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat._id || cat.id}
                  href={`/category/${cat.slug}`}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-all duration-300",
                    pathname === `/category/${cat.slug}`
                      ? "bg-foreground/5 text-primary"
                      : "text-foreground/30 hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </section>
        )}
      </div>

      {!user && (
         <div className="p-6 border-t border-white/5">
            <Link href="/login">
                <Button variant="outline" className="w-full glass-light border-foreground/10 text-foreground/50 hover:text-foreground h-12 rounded-xl">
                    Sign In
                </Button>
            </Link>
         </div>
      )}
    </aside>
  )
}
