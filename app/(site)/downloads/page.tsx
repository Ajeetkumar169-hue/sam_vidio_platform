"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Trash2, TrendingUp, MoreVertical, CheckCircle2, Download } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const history = JSON.parse(localStorage.getItem("download_history") || "[]")
    // Sort by downloadedAt (newest first)
    const sorted = history.sort((a: any, b: any) => b.downloadedAt - a.downloadedAt)
    setDownloads(sorted)
  }, [])

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear your download history?")) {
      localStorage.removeItem("download_history")
      setDownloads([])
      toast.success("Download history cleared")
    }
  }

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const updated = downloads.filter(item => (item.id || item._id) !== id)
    localStorage.setItem("download_history", JSON.stringify(updated))
    setDownloads(updated)
    toast.success("Removed from downloads")
  }

  function formatViews(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  function timeAgo(date: number | string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  }

  if (!mounted) return null

  return (
    <div className="max-w-screen-md mx-auto px-4 md:px-0 py-8 animate-in fade-in duration-700">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Your downloads</h1>
        {downloads.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-destructive transition-colors h-10 w-10 rounded-full p-0"
            title="Clear all downloads"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </header>

      {downloads.length > 0 ? (
        <div className="space-y-6">
           <div className="flex flex-col gap-6">
              {downloads.map((video) => (
                <Link 
                  key={video.id || video._id} 
                  href={`/watch/${video.id || video._id}`}
                  className="group relative flex gap-4 hover:bg-foreground/5 p-2 rounded-2xl transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative w-40 h-24 md:w-56 md:h-32 shrink-0 overflow-hidden rounded-xl bg-secondary">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {video.duration && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-bold px-1 rounded">
                        {video.duration}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-8">
                    <h2 className="text-sm md:text-lg font-bold line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1">
                      {video.title}
                    </h2>
                    <div className="flex flex-col text-xs md:text-sm text-muted-foreground gap-0.5">
                       <div className="flex items-center gap-1.5">
                         {video.isOfflineReady && <CheckCircle2 className="h-3 w-3 text-primary fill-current" />}
                         <span className="truncate">{video.channel?.name || "Unknown Channel"}</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                         <span>{formatViews(video.views || 0)} views</span>
                         <span>•</span>
                         <span>{timeAgo(video.createdAt || video.downloadedAt)}</span>
                       </div>
                    </div>
                  </div>

                  {/* Menu Button */}
                  <button 
                    onClick={(e) => handleRemoveItem(video.id || video._id, e)}
                    className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/10 rounded-full transition-all"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </Link>
              ))}
           </div>

           {/* Policy Text (Matching Screenshot) */}
           <div className="mt-12 pt-8 border-t border-foreground/5">
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-medium">
                Downloads remain available as long as your device has an internet connection every 29 days. This process happens automatically and does not re-download the video.
              </p>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center rounded-[2.5rem] bg-foreground/5 border-2 border-dashed border-foreground/10 px-6">
          <div className="h-24 w-24 rounded-full bg-foreground/5 flex items-center justify-center mb-6">
            <Download className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-black text-foreground mb-3">No Downloads Yet</h2>
          <p className="text-muted-foreground max-w-xs mb-8 font-medium">
            Videos you download for offline viewing will appear here. Start exploring!
          </p>
          <Link href="/trending">
            <Button className="rounded-2xl h-14 px-8 font-black gap-3 shadow-xl shadow-primary/20 active-bounce">
              <TrendingUp className="h-5 w-5" />
              Discover Trending content
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
