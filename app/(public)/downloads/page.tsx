"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { VideoGrid } from "@/components/video-grid"
import { Button } from "@/components/ui/button"
import { Trash2, Download, TrendingUp, Info } from "lucide-react"
import { toast } from "sonner"

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
    if (confirm("Are you sure you want to clear your download history? This will not delete the physical files from your device.")) {
      localStorage.removeItem("download_history")
      setDownloads([])
      toast.success("Download history cleared")
    }
  }

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    const updated = downloads.filter(item => item.id !== id)
    localStorage.setItem("download_history", JSON.stringify(updated))
    setDownloads(updated)
    toast.success("Removed from history")
  }

  if (!mounted) return null

  return (
    <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 animate-in fade-in duration-700">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary mb-2">
            <Download className="h-6 w-6" />
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Downloads</h1>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-sm italic">
            <Info className="h-4 w-4" />
            Recently Downloaded History (Physical files are in your device's storage)
          </p>
        </div>

        {downloads.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearAll}
            className="w-full md:w-auto gap-2 rounded-xl glass-panel text-red-500 hover:text-white border-red-500/20 active-bounce group"
          >
            <Trash2 className="h-4 w-4 group-hover:rotate-12 transition-transform" />
            Clear Library
          </Button>
        )}
      </header>

      {downloads.length > 0 ? (
        <div className="space-y-6">
           <VideoGrid videos={downloads} emptyMessage="No history found" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center rounded-[2rem] glass-panel border-dashed border-2 border-foreground/5 mx-auto max-w-2xl px-6">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Download className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Downloads Found</h2>
          <p className="text-muted-foreground max-w-sm mb-8">
            Start downloading your favorite videos to see them here. Note that clearing your browser data will reset this history.
          </p>
          <Link href="/trending">
            <Button className="rounded-2xl gap-2 h-12 px-8 font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              <TrendingUp className="h-5 w-5" />
              Discover Trending
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
