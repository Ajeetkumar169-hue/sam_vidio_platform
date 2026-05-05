"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { 
  Trash2, 
  History as HistoryIcon, 
  Search, 
  Loader2, 
  MoreVertical, 
  Download, 
  Share2, 
  Pause, 
  Settings, 
  X 
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns"

interface HistoryItem {
  _id: string
  video: any
  updatedAt: string
}

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "videos" | "shorts">("all")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/history")
      const data = await res.json()
      if (data.history) {
        setHistory(data.history)
      }
    } catch (error) {
      console.error("Fetch history error:", error)
      toast.error("Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      fetchHistory()
    }
  }, [user, authLoading, router, fetchHistory])

  const removeFromHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setHistory(prev => prev.filter(item => item._id !== id))
      toast.success("Removed from history")
    } catch (error) {
      toast.error("Failed to remove item")
    }
  }

  const clearHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire watch history?")) return
    
    setClearing(true)
    try {
      const res = await fetch("/api/history/clear", { method: "DELETE" })
      if (!res.ok) throw new Error()
      setHistory([])
      toast.success("Watch history cleared")
    } catch (error) {
      toast.error("Failed to clear history")
    } finally {
      setClearing(false)
    }
  }

  const filteredHistory = history.filter(item => {
    const matchesFilter = 
      filter === "all" ? true :
      filter === "videos" ? !item.video.isShort :
      item.video.isShort
    
    const matchesSearch = item.video.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Grouping by date
  const groups: { [key: string]: HistoryItem[] } = {}
  filteredHistory.forEach(item => {
    const date = new Date(item.updatedAt)
    let groupKey = format(date, "MMMM d, yyyy")
    if (isToday(date)) groupKey = "Today"
    else if (isYesterday(date)) groupKey = "Yesterday"
    
    if (!groups[groupKey]) groups[groupKey] = []
    groups[groupKey].push(item)
  })

  if (authLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        
        {/* Main Content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight mb-6">Watch history</h1>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8">
               {(["all", "videos", "shorts"] as const).map((t) => (
                 <button
                   key={t}
                   onClick={() => setFilter(t)}
                   className={cn(
                     "px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all",
                     filter === t ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                   )}
                 >
                   {t}
                 </button>
               ))}
            </div>
          </div>

          {Object.keys(groups).length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 opacity-50 grayscale">
                <HistoryIcon className="h-20 w-20 mb-4 text-muted-foreground" />
                <p className="font-bold uppercase tracking-widest text-sm text-center">No history found for this selection</p>
             </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groups).map(([date, items]) => (
                <section key={date}>
                  <h2 className="text-xl font-bold text-foreground mb-6">{date}</h2>
                  <div className="space-y-6">
                    {items.map((item) => (
                      <div key={item._id} className="group relative flex gap-4 w-full">
                        {/* Thumbnail */}
                        <div 
                          className="relative aspect-video w-48 sm:w-64 flex-shrink-0 overflow-hidden rounded-xl bg-secondary cursor-pointer"
                          onClick={() => router.push(`/watch/${item.video._id || item.video.id}`)}
                        >
                          <img src={item.video.thumbnailUrl} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {item.video.duration || "10:00"}
                          </div>
                          {/* Progress Bar (Mock) */}
                          <div className="absolute bottom-0 left-0 h-1 bg-red-600 shadow-[0_0_5px_rgba(255,0,0,0.5)]" style={{ width: '85%' }} />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 pr-8">
                           <h3 
                             className="text-lg font-bold text-foreground line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors"
                             onClick={() => router.push(`/watch/${item.video._id || item.video.id}`)}
                           >
                              {item.video.title}
                           </h3>
                           <div className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                              <p className="hover:text-foreground cursor-pointer transition-colors">{(item.video as any).channelName || (item.video as any).channel?.name}</p>
                              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                              <p>{(item.video as any).views || 0} views</p>
                           </div>
                           <p className="mt-3 text-xs text-muted-foreground/60 line-clamp-2 max-w-xl">
                              {item.video.description || "No description provided for this video."}
                           </p>
                        </div>

                        {/* Actions Menu */}
                        <div className="absolute right-0 top-0">
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-white/10 text-muted-foreground transition-colors">
                                    <MoreVertical className="h-5 w-5" />
                                 </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/10 rounded-xl p-1 shadow-2xl">
                                 <DropdownMenuItem className="flex items-center gap-3 py-2.5 rounded-lg cursor-pointer focus:bg-white/10">
                                    <Download className="h-4 w-4" />
                                    <span className="font-bold text-sm">Download</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="flex items-center gap-3 py-2.5 rounded-lg cursor-pointer focus:bg-white/10">
                                    <Share2 className="h-4 w-4" />
                                    <span className="font-bold text-sm">Share</span>
                                 </DropdownMenuItem>
                                 <DropdownMenuItem 
                                   className="flex items-center gap-3 py-2.5 rounded-lg cursor-pointer focus:bg-white/10 text-red-500"
                                   onClick={() => removeFromHistory(item._id)}
                                 >
                                    <X className="h-4 w-4" />
                                    <span className="font-bold text-sm">Remove from watch history</span>
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           {/* Search */}
           <div className="relative group">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-white transition-colors" />
              <input 
                type="text" 
                placeholder="Search watch history"
                className="w-full bg-transparent border-b border-white/10 pl-8 pb-2 text-sm focus:outline-none focus:border-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>

           {/* Quick Actions */}
           <div className="space-y-1">
              <SidebarAction 
                icon={<Trash2 className="h-5 w-5" />} 
                label="Clear all watch history" 
                onClick={clearHistory}
                disabled={clearing}
              />
              <SidebarAction 
                icon={<Pause className="h-5 w-5" />} 
                label="Pause watch history" 
              />
              <SidebarAction 
                icon={<Settings className="h-5 w-5" />} 
                label="Manage all history" 
              />
           </div>

           {/* External Links (Mock) */}
           <div className="pt-4 space-y-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <p className="hover:text-white cursor-pointer transition-colors">Comments</p>
              <p className="hover:text-white cursor-pointer transition-colors">Community posts</p>
              <p className="hover:text-white cursor-pointer transition-colors">Live chat</p>
           </div>
        </div>

      </div>
    </div>
  )
}

function SidebarAction({ icon, label, onClick, disabled }: { icon: React.ReactNode, label: string, onClick?: () => void, disabled?: boolean }) {
  return (
    <button 
      className="w-full flex items-center gap-4 py-3 px-2 rounded-xl text-foreground/80 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className="text-sm font-bold tracking-tight">{label}</span>
    </button>
  )
}
