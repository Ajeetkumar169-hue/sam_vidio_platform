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
  video: VideoData
  className?: string
}

export function DownloadButton({ video, className }: DownloadButtonProps) {
  const [status, setStatus] = useState<"idle" | "preparing" | "completed" | "restricted">("idle")
  
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

  const handleDownload = () => {
    if (status === "restricted") return

    try {
      // 2. Instant History Update (Deduplicated with Timestamp refresh)
      const newItem = {
        id: video._id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        views: video.views,
        createdAt: video.createdAt,
        duration: video.duration,
        channel: video.channel,
        downloadedAt: Date.now()
      }

      let history = JSON.parse(localStorage.getItem("download_history") || "[]")
      // Remove existing to move to top
      history = history.filter((item: any) => item.id !== video._id)
      history.unshift(newItem)
      
      // Limit history to 100 items to protect LocalStorage quota
      localStorage.setItem("download_history", JSON.stringify(history.slice(0, 100)))
      
      // 3. Trigger Browser-Native Download (Zero-Memory Anchor Method)
      const filename = sanitizeFilename(video.title, video._id)
      const link = document.body.appendChild(document.createElement("a"))
      link.href = video.videoUrl
      link.download = filename
      link.click()
      
      // 4. Lifecycle Management
      document.body.removeChild(link)
      setStatus("completed")
      toast.success("Download started!")
    } catch (error) {
       console.error("Download trigger failed:", error)
       toast.error("Could not initialize download")
    }
  }

  const handleOpenNewTab = () => {
    window.open(video.videoUrl, "_blank", "noopener,noreferrer")
    toast.info("Opening in new tab for manual save")
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
