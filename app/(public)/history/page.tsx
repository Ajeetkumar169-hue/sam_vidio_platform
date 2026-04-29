"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { Trash2, History as HistoryIcon, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface HistoryItem {
  _id: string
  video: any
  updatedAt: string
}

export default function HistoryPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [clearing, setClearing] = useState(false)

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

  if (authLoading || loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black uppercase tracking-tighter text-foreground">
            <HistoryIcon className="h-8 w-8 text-primary" />
            Watch History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground uppercase tracking-widest font-bold opacity-60">
            Revisit your favorite moments and track your progress.
          </p>
        </div>
        
        {history.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-10 rounded-full px-6 font-bold uppercase tracking-widest shadow-lg shadow-destructive/20 transition-all hover:scale-105"
            onClick={clearHistory}
            disabled={clearing}
          >
            {clearing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Clear All History
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex h-[50vh] flex-col items-center justify-center rounded-3xl bg-secondary/30 border border-white/5 px-4 text-center">
          <div className="mb-6 rounded-full bg-secondary p-8 shadow-inner">
            <Search className="h-20 w-20 text-foreground/10" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-2">Your history is a blank canvas.</h2>
          <p className="max-w-md text-sm text-muted-foreground uppercase tracking-widest font-bold opacity-40 mb-8">
             Start exploring the platform to see your history appear here. Every view is recorded for your convenience.
          </p>
          <Button 
            className="rounded-full px-8 h-12 font-black uppercase tracking-[0.2em]"
            onClick={() => router.push("/")}
          >
            Explore Videos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {history.map((item) => (
            <div key={item._id} className="group relative">
               <VideoCard video={item.video} />
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="h-8 w-8 rounded-full shadow-lg"
                    onClick={() => removeFromHistory(item._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
               </div>
               <div className="mt-1 px-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                     <HistoryIcon className="h-2.5 w-2.5" />
                     Watched {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
