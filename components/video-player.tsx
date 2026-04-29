"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"

interface VideoPlayerProps {
  url: string
  poster?: string
  className?: string
}

export function VideoPlayer({ url, poster, className = "" }: VideoPlayerProps) {
  const [playerType, setPlayerType] = useState<"video" | "iframe" | "unknown">("unknown")
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    // 1. Check if it's a direct video link
    const isDirectVideo = url.match(/\.(mp4|webm|ogg|mov|m4v)$|^(\/uploads\/)/i)
    
    if (isDirectVideo) {
      setPlayerType("video")
      return
    }

    // 2. Handle YouTube
    const ytMatch = url.match(/(?:\?v=|&v=|youtu\.be\/|\/embed\/|\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`)
      return
    }

    // 3. Handle xHamster
    // Pattern: https://xhamster.com/videos/slug-id
    const xhMatch = url.match(/xhamster\.com\/videos\/.*-([a-zA-Z0-9]+)/)
    if (xhMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://xhamster.com/embed/${xhMatch[1]}`)
      return
    }

    // 4. Handle Pornhub
    const phMatch = url.match(/pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/)
    if (phMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://www.pornhub.com/embed/${phMatch[1]}`)
      return
    }

    // 5. Handle Vimeo
    const vmMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vmMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`)
      return
    }

    // Fallback: If it's a link but not a recognized video file, try playing as video or show error
    // For now, assume if it starts with http, it might be a direct link without extension
    if (url.startsWith("http")) {
      setPlayerType("video")
    } else {
      setError("Unsupported video source")
    }
  }, [url])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-secondary/50 rounded-lg border border-dashed border-border ${className}`}>
        <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
          <AlertCircle className="h-8 w-8 text-destructive/50" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    )
  }

  if (playerType === "unknown") {
    return (
      <div className={`flex items-center justify-center bg-black rounded-lg ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (playerType === "iframe") {
    return (
      <div className={`w-full h-full ${className}`}>
        <iframe
          src={embedUrl}
          className="w-full h-full border-none sm:rounded-lg"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video Player"
        />
      </div>
    )
  }

  return (
    <video
      src={url}
      controls
      className={`h-full w-full object-contain bg-black sm:rounded-lg ${className}`}
      poster={poster}
      playsInline
      preload="metadata"
    >
      <track kind="captions" />
      Your browser does not support the video tag.
    </video>
  )
}
