"use client"

import { useState, useEffect } from "react"
import { Download, CheckCircle, AlertCircle, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface VideoData {
  _id: string
  title: string
  thumbnailUrl: string
  videoUrl: string
  views: number
  createdAt: string
  duration?: number | string
  channel?: {
    name: string
    slug: string
  }
}

interface DownloadButtonProps {
  video: any // Use any for flexibility or specific VideoData
  className?: string
  trigger?: React.ReactNode
}

export function DownloadButton({ video, className, trigger }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "preparing" | "completed" | "restricted" | "saving">("idle")
  const [offlineProgress, setOfflineProgress] = useState(0)
  
  // 1. Domain & Extension Validation (Security Hardening)
  const isDirectVideo = 
    video.videoUrl.match(/\.(mp4|webm|ogg|mov|m4v)$/i) || 
    video.videoUrl.startsWith("/uploads/") ||
    video.videoUrl.includes("res.cloudinary.com") || // Standard CDN
    video.videoUrl.includes("s3.amazonaws.com")      // Standard Storage

  useEffect(() => {
    if (!isDirectVideo) {
      setStatus("restricted")
      return
    }

    // Check if already in history
    const history = JSON.parse(localStorage.getItem("download_history") || "[]")
    const exists = history.some((item: any) => item.id === video._id)
    if (exists) setStatus("completed")
  }, [video._id, isDirectVideo])

  const sanitizeFilename = (title: string, id: string) => {
    const safeTitle = (title || "video")
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 60)
    return `${safeTitle}_${id}.mp4`
  }

  const handleDownload = async () => {
    if (status === "restricted") return

    try {
      setStatus("saving")
      setOfflineProgress(0)

      // 1. Save to PWA Cache for Offline Watching
      const cache = await caches.open("video-downloads-v1")
      
      // Check if already cached
      const cachedResponse = await cache.match(video.videoUrl)
      if (!cachedResponse) {
        toast.info("Saving for offline viewing...", { duration: 2000 })
        
        // Fetch and cache the video
        const response = await fetch(video.videoUrl)
        if (!response.ok) throw new Error("Failed to fetch video for offline")
        
        await cache.put(video.videoUrl, response)
      }

      // 2. Instant History Update
      const newItem = {
        id: video._id,
        _id: video._id, // Ensure both ID formats work
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        videoUrl: video.videoUrl,
        views: video.views,
        createdAt: video.createdAt,
        duration: video.duration,
        channel: video.channel,
        downloadedAt: Date.now(),
        isOfflineReady: true
      }

      let history = JSON.parse(localStorage.getItem("download_history") || "[]")
      history = history.filter((item: any) => item.id !== video._id)
      history.unshift(newItem)
      localStorage.setItem("download_history", JSON.stringify(history.slice(0, 100)))
      
      // 3. Trigger Browser-Native Download (Optional fallback for physical file)
      const filename = sanitizeFilename(video.title, video._id)
      const link = document.body.appendChild(document.createElement("a"))
      link.href = video.videoUrl
      link.download = filename
      link.click()
      document.body.removeChild(link)
      
      setStatus("completed")
      toast.success("Saved for offline viewing!")
    } catch (error) {
       console.error("Offline save failed:", error)
       toast.error("Could not save for offline viewing")
       setStatus("idle")
    }
  }

  const handleOpenNewTab = () => {
    window.open(video.videoUrl, "_blank", "noopener,noreferrer")
    toast.info("Opening in new tab for manual save")
  }

  if (trigger) {
    return <div onClick={handleDownload} className="cursor-pointer">{trigger}</div>
  }

  if (status === "restricted") {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled 
        className={cn("gap-2 opacity-50 cursor-not-allowed", className)}
      >
        <AlertCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Download Restricted</span>
      </Button>
    )
  }

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2">
         <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            className={cn("gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10", className)}
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Downloaded</span>
          </Button>
          {/* Subtle Mobile Fallback Tooltip Area */}
          <button 
            onClick={handleOpenNewTab}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Try Manual Save"
          >
             <ExternalLink className="h-4 w-4" />
          </button>
      </div>
    )
  }

  if (status === "saving") {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled
        className={cn("gap-2 border-primary/20 bg-primary/5", className)}
      >
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="hidden sm:inline">Saving Offline...</span>
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDownload}
        className={cn("gap-2 hover:bg-primary hover:text-primary-foreground transition-all active-bounce", className)}
      >
        <Download className="h-4 w-4" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <button 
        onClick={handleOpenNewTab}
        className="hidden sm:flex p-2 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        title="Open in New Tab"
      >
         <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  )
}
