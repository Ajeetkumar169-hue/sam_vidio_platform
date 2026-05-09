"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Search, Upload, User, LogOut, LayoutDashboard, Film, Settings, Bell, Check, Clock, ArrowUpLeft, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClickAway } from "../hooks/use-click-away"

interface HeaderProps {
  onMenuClick: () => void
}


export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [history, setHistory] = useState<string[]>([])

  const suggestionsRef = useClickAway(() => {
    setShowSuggestions(false)
  })

  // Load local search history
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("search_history") || "[]")
    setHistory(saved)
  }, [])

  // Fetch notifications and unread count
  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const res = await fetch("/api/notifications?limit=5")
          const data = await res.json()
          if (data.success) {
            setNotifications(data.notifications)
            // For count, we might want a separate lighter API later, but this works for now
            const unreadRes = await fetch("/api/notifications?unreadOnly=true&limit=1")
            const unreadData = await unreadRes.json()
            setUnreadCount(unreadData.total || 0)
          }
        } catch (err) {
          console.error("Failed to fetch notifications")
        }
      }

      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000) // Poll every 60s
      return () => clearInterval(interval)
    }
  }, [user])

  const handleNotificationClick = async (notif: any) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "single", id: notif._id }),
      })
      setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((prev) => prev.map(n => n._id === notif._id ? { ...n, read: true } : n))
      if (notif.video) {
        router.push(`/watch/${notif.video}`)
      }
    } catch (err) {
      console.error("Failed to update notification status")
    }
  }

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      })
      setUnreadCount(0)
      setNotifications((prev) => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error("Failed to mark all as read")
    }
  }

  // Fetch Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        try {
          const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          setSuggestions(data.data?.suggestions || [])
        } catch {
          setSuggestions([])
        }
      } else {
        setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearch = (e?: React.FormEvent, item?: any) => {
    if (e) e.preventDefault()
    
    // If it's a suggestion object
    if (item && typeof item === "object") {
        const term = item.text
        const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 10)
        setHistory(newHistory)
        localStorage.setItem("search_history", JSON.stringify(newHistory))
        setShowSuggestions(false)

        if (item.type === "channel") {
            router.push(`/channel/${item.slug}`)
        } else if (item.type === "actor") {
            router.push(`/actors/${item.slug}`)
        } else {
            router.push(`/search?q=${encodeURIComponent(term)}`)
        }
        return
    }

    const finalQuery = (typeof item === "string" ? item : searchQuery).trim()
    if (finalQuery) {
      // Save to history
      const newHistory = [finalQuery, ...history.filter(h => h !== finalQuery)].slice(0, 10)
      setHistory(newHistory)
      localStorage.setItem("search_history", JSON.stringify(newHistory))
      
      setShowSuggestions(false)
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`)
    }
  }

  const removeFromHistory = (e: React.MouseEvent, term: string) => {
    e.stopPropagation()
    const newHistory = history.filter(h => h !== term)
    setHistory(newHistory)
    localStorage.setItem("search_history", JSON.stringify(newHistory))
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-foreground/5 bg-background/60 px-6 backdrop-blur-xl luxury-easing">
      {/* Left: Logo */}
      <div className="flex items-center gap-4 md:w-1/4">
        <Link href="/" className="logo-text text-2xl tracking-tighter" data-text="SAM">
          SAM
        </Link>
      </div>

        {/* Center: Search */}
        <div className="flex flex-1 items-center justify-center md:w-2/4 relative">
          
          {/* Desktop Search - Premium SaaS Style */}
          <form onSubmit={handleSearch} className="hidden md:flex w-full max-w-xl group relative z-50" ref={suggestionsRef}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-foreground/20 group-focus-within:text-primary transition-colors">
              <Search className="h-4 w-4" />
            </div>
            <Input
              type="search"
              placeholder="Search anything..."
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-10 rounded-full glass-light border-foreground/5 text-sm transition-all focus-visible:ring-primary/20 focus-visible:bg-foreground/5"
            />
            {showSuggestions && (searchQuery.length > 0 || history.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-foreground/10 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="max-h-[70vh] overflow-y-auto platinum-scrollbar">
                        {/* History Items */}
                        {searchQuery.length === 0 && history.map((term) => (
                            <div 
                              key={term}
                              onClick={() => handleSearch(undefined, term)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/5 rounded-xl cursor-pointer group"
                            >
                                <Clock className="h-4 w-4 text-muted-foreground/40" />
                                <span className="flex-1 text-sm font-bold truncate text-primary/80">{term}</span>
                                <button onClick={(e) => removeFromHistory(e, term)} className="p-1 hover:bg-foreground/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </div>
                        ))}

                        {/* Suggestion Items */}
                        {suggestions.map((s, idx) => (
                            <div 
                              key={`${s.text}-${idx}`}
                              onClick={() => handleSearch(undefined, s)}
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/5 rounded-xl cursor-pointer group"
                            >
                                {s.type === "channel" ? <User className="h-4 w-4 text-primary/40" /> :
                                 s.type === "actor" ? <Film className="h-4 w-4 text-primary/40" /> :
                                 <Search className="h-4 w-4 text-muted-foreground/40" />}
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold truncate">{s.text}</span>
                                        {s.type !== "suggestion" && s.type !== "tag" && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 bg-primary/5 px-1.5 py-0.5 rounded-full">
                                                {s.type}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {s.thumbnail && (
                                    <div className={cn(
                                        "h-9 w-12 rounded-lg bg-foreground/5 overflow-hidden border border-foreground/10 shrink-0",
                                        (s.type === "channel" || s.type === "actor") && "w-9 rounded-full"
                                    )}>
                                        <img src={s.thumbnail} className="h-full w-full object-cover" alt="" />
                                    </div>
                                )}
                                <ArrowUpLeft className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </form>

          {/* Click away layer */}
          {showSuggestions && (
              <div 
                className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm md:bg-transparent" 
                onClick={() => setShowSuggestions(false)}
              />
          )}

          {/* Mobile Search Overlay */}
          {showSuggestions && (
              <div className="fixed inset-0 z-[100] bg-background md:hidden flex flex-col animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-3 p-4 border-b border-foreground/5">
                      <Button variant="ghost" size="icon" onClick={() => setShowSuggestions(false)}>
                          <Menu className="h-5 w-5 rotate-90" />
                      </Button>
                      <form onSubmit={handleSearch} className="flex-1 flex items-center bg-foreground/5 rounded-full px-4 h-10">
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Search..." 
                            className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          {searchQuery && (
                              <button type="button" onClick={() => setSearchQuery("")}>
                                  <X className="h-4 w-4 text-muted-foreground" />
                              </button>
                          )}
                      </form>
                      <Button type="button" variant="ghost" size="icon">
                         <div className="h-9 w-9 rounded-full bg-foreground/5 flex items-center justify-center">
                            <Menu className="h-5 w-5" /> {/* This is the voice icon in the screenshot */}
                         </div>
                      </Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                        {/* Mobile suggestions look identical to desktop suggestions but full width */}
                        {searchQuery.length === 0 && history.map((term) => (
                            <div 
                              key={term}
                              onClick={() => handleSearch(undefined, term)}
                              className="flex items-center gap-4 px-4 py-3.5 hover:bg-foreground/5 rounded-xl cursor-pointer group"
                            >
                                <Clock className="h-5 w-5 text-muted-foreground/40" />
                                <span className="flex-1 text-sm font-bold truncate text-primary/80">{term}</span>
                                <ArrowUpLeft className="h-5 w-5 text-muted-foreground/20" />
                            </div>
                        ))}
                        {suggestions.map((s, idx) => (
                            <div 
                              key={`${s.text}-${idx}`}
                              onClick={() => handleSearch(undefined, s)}
                              className="flex items-center gap-4 px-4 py-3.5 hover:bg-foreground/5 rounded-xl cursor-pointer group"
                            >
                                {s.type === "channel" ? <User className="h-5 w-5 text-primary/40" /> :
                                 s.type === "actor" ? <Film className="h-5 w-5 text-primary/40" /> :
                                 <Search className="h-5 w-5 text-muted-foreground/40" />}
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold truncate">{s.text}</span>
                                        {s.type !== "suggestion" && s.type !== "tag" && (
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary/40 bg-primary/5 px-1.5 py-0.5 rounded-full">
                                                {s.type}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {s.thumbnail && (
                                    <div className={cn(
                                        "h-10 w-14 rounded-lg bg-foreground/5 overflow-hidden border border-foreground/10 shrink-0",
                                        (s.type === "channel" || s.type === "actor") && "w-10 rounded-full"
                                    )}>
                                        <img src={s.thumbnail} className="h-full w-full object-cover" alt="" />
                                    </div>
                                )}
                                <ArrowUpLeft className="h-5 w-5 text-muted-foreground/20" />
                            </div>
                        ))}
                  </div>
              </div>
          )}
        </div>

      {/* Right: Actions */}
      <div className="flex items-center justify-end gap-3 md:w-1/4">
        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground/50"
          onClick={() => setShowSuggestions(true)}
        >
          <Search className="h-5 w-5" />
        </Button>

        {user ? (
          <>
            <Link href="/upload">
              <Button variant="ghost" size="icon" className="hidden sm:flex text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                <Upload className="h-5 w-5" />
              </Button>
            </Link>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground/50 hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg animate-in zoom-in-50 duration-300">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 glass-heavy border-foreground/10 text-foreground rounded-2xl p-0 premium-shadow animate-in zoom-in-95 duration-200 luxury-easing overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/5 bg-foreground/5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground/60">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllRead} className="h-6 text-[10px] gap-1 font-bold uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10 rounded-full px-2">
                      <Check className="h-3 w-3" />
                      Mark all read
                    </Button>
                  )}
                </div>
                
                <div className="max-h-[400px] overflow-y-auto platinum-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                      <Bell className="h-8 w-8 text-foreground/10 mb-2" />
                      <p className="text-xs text-foreground/30 font-bold uppercase tracking-widest">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem 
                        key={n._id} 
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "flex items-start gap-3 p-4 cursor-pointer focus:bg-foreground/5 transition-colors border-b border-foreground/[0.03] last:border-0",
                          !n.read && "bg-primary/[0.03]"
                        )}
                      >
                        {n.meta?.thumbnail ? (
                          <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-foreground/5">
                            <img src={n.meta.thumbnail} alt="" className="h-full w-full object-cover" />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-foreground/5">
                            <Film className="h-5 w-5 text-foreground/20" />
                          </div>
                        )}
                        <div className="flex-1 space-y-1">
                          <p className={cn("text-xs leading-snug", !n.read ? "font-bold text-foreground" : "text-foreground/60")}>
                            <span className="text-primary">{n.meta?.channelName || "Channel"}</span> uploaded: {n.meta?.title || "New video"}
                          </p>
                          <p className="text-[10px] text-foreground/30 font-medium">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {!n.read && (
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <Link href="/subscriptions" className="block text-center py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/20 hover:text-foreground/40 hover:bg-foreground/5 transition-all border-t border-foreground/5">
                    View Subscription Feed
                  </Link>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:flex h-9 w-9 p-0 rounded-full border border-foreground/10 hover:border-foreground/20 transition-all overflow-hidden premium-shadow">
                   {user.avatar ? (
                      <img src={user.avatar} alt={user.username} className="h-full w-full object-cover transition-transform hover:scale-110 duration-500" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/5">
                        <User className="h-4 w-4 text-white/40" />
                      </div>
                    )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-heavy border-foreground/10 text-foreground rounded-2xl p-2 premium-shadow animate-in zoom-in-95 duration-200 luxury-easing">
                <div className="px-3 py-3 border-b border-foreground/5 mb-1">
                  <p className="text-sm font-bold truncate">{user.username}</p>
                  <p className="text-[10px] text-foreground/40 uppercase tracking-widest truncate">{user.email}</p>
                </div>
                
                <DropdownMenuItem className="rounded-xl focus:bg-white/10 cursor-pointer py-2.5" onClick={() => router.push(`/channel/${user.channel?.slug || user.username}`)}>
                  <Film className="mr-3 h-4 w-4 text-foreground/40" />
                  <span className="text-xs font-medium">My Channel</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="rounded-xl focus:bg-foreground/10 cursor-pointer py-2.5" onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-3 h-4 w-4 text-foreground/40" />
                  <span className="text-xs font-medium">Dashboard</span>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="rounded-xl focus:bg-foreground/10 cursor-pointer py-2.5" onClick={() => router.push("/settings")}>
                  <Settings className="mr-3 h-4 w-4 text-foreground/40" />
                  <span className="text-xs font-medium">Settings</span>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="bg-foreground/5 my-1" />
                
                <DropdownMenuItem className="rounded-xl focus:bg-red-500/10 text-red-400 focus:text-red-400 cursor-pointer py-2.5" onClick={() => logout()}>
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="text-xs font-medium">Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Link href="/login">
            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-full px-5 h-9 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
