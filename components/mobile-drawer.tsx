"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { 
  X, 
  Upload, 
  Film, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Grid3X3,
  Download,
  Shield,
  MessageCircle,
} from "lucide-react"

interface Category {
  _id?: string
  id?: string
  name: string
  slug: string
}

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.categories) setCategories(d.categories)
      })
      .catch(() => { })
  }, [])

  // Body scroll lock
  useEffect(() => {
    if (!mounted) return
    if (open) {
      document.body.classList.add("drawer-open")
    } else {
      document.body.classList.remove("drawer-open")
    }
    return () => document.body.classList.remove("drawer-open")
  }, [open, mounted])

  // Auto-close on route change
  useEffect(() => {
    if (open) onClose()
  }, [pathname])

  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 lg:hidden" 
        onClick={onClose}
      />
      <div 
         className={cn(
           "fixed inset-y-0 right-0 z-[120] w-[75%] max-w-[300px] glass-panel shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden",
           open ? "translate-x-0" : "translate-x-full"
         )}
      >
        <div className="flex flex-col h-full bg-foreground/[0.02]">
          <div className="flex h-16 items-center justify-between px-6 border-b border-foreground/5">
             <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-black uppercase tracking-widest text-foreground">Menu</span>
             </div>
             <button 
                onClick={onClose} 
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/10 active:scale-95 transition-all"
                aria-label="Close menu"
             >
                <X className="h-6 w-6" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8 platinum-scrollbar space-y-10">
            {/* 1. Discover Section */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 px-1">Discover</h3>
              <nav className="grid grid-cols-2 gap-2">
                 <Link href="/trending" className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all text-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Trending</span>
                 </Link>
                 <Link href="/latest" className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all text-center">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Latest</span>
                 </Link>
                 <Link href="/top-rated" className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all text-center">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Top Rated</span>
                 </Link>
                 <Link href="/categories" className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all text-center">
                    <Grid3X3 className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Categories</span>
                 </Link>
                 <Link href="/downloads" className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all text-center">
                    <Download className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Downloads</span>
                 </Link>
                 <Link href="/chat" className="flex flex-col items-center gap-2 p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all text-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">Chat Group</span>
                 </Link>
              </nav>
            </section>

            {/* 2. Studio Tools */}
            {user && (
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 px-1">Studio Tools</h3>
                <nav className="grid gap-2">
                   <Link href="/upload" className="flex items-center justify-between p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="p-2 rounded-xl bg-primary/10 text-primary"><Upload className="h-4 w-4" /></div>
                         <span className="text-sm font-medium text-foreground">Upload Video</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                   </Link>
                   <Link href={`/channel/${user.channel?.slug || user.username}`} className="flex items-center justify-between p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="p-2 rounded-xl bg-primary/10 text-primary"><Film className="h-4 w-4" /></div>
                         <span className="text-sm font-medium text-foreground">Your Channel</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                   </Link>
                   <Link href="/dashboard" className="flex items-center justify-between p-4 rounded-2xl glass-light hover:bg-foreground/5 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="p-2 rounded-xl bg-primary/10 text-primary"><LayoutDashboard className="h-4 w-4" /></div>
                         <span className="text-sm font-medium text-foreground">Dashboard</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
                   </Link>
                </nav>
              </section>
            )}

            {/* 3. Administrator (Admin Only) */}
            {user?.role === "admin" && (
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-red-500/40 px-1">Administrator</h3>
                <nav className="grid gap-2">
                   <Link href="/admin" className="flex items-center justify-between p-4 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="p-2 rounded-xl bg-red-500/10 text-red-500"><Shield className="h-4 w-4" /></div>
                         <span className="text-sm font-bold text-foreground">Admin Console</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-red-500/50 group-hover:text-red-500 transition-all" />
                   </Link>
                </nav>
              </section>
            )}

            {/* 3. Account Section */}
            <section className="space-y-4 pt-4 border-t border-foreground/5">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/40 px-1">Account</h3>
                <nav className="grid gap-2">
                   <Link href="/settings" className="flex items-center gap-4 p-4 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all">
                      <Settings className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Settings</span>
                   </Link>
                   <button onClick={() => logout()} className="flex items-center gap-4 p-4 rounded-2xl text-red-500/50 hover:text-red-500 hover:bg-red-500/5 transition-all">
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm font-medium">Log Out</span>
                   </button>
                </nav>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
