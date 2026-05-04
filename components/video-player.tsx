"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import Hls from "hls.js"

interface Quality {
  label: string
  url: string
}

interface VideoPlayerProps {
  url: string
  poster?: string
  className?: string
  qualities?: Quality[]
}

export function VideoPlayer({ url, poster, className = "", qualities = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playerType, setPlayerType] = useState<"video" | "iframe" | "unknown">("unknown")
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(url)
  const [currentQuality, setCurrentQuality] = useState("Auto")

  useEffect(() => {
    setCurrentUrl(url)
  }, [url])

  useEffect(() => {
    if (!currentUrl || !videoRef.current) return

    const isHLS = currentUrl.includes(".m3u8")
    const video = videoRef.current

    if (isHLS) {
        if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(currentUrl)
            hls.attachMedia(video)
            return () => hls.destroy()
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = currentUrl
        }
    } else {
        video.src = currentUrl
    }
  }, [currentUrl])

  useEffect(() => {
    if (!currentUrl) return

    // 1. Check if it's a direct video link
    const isDirectVideo = currentUrl.match(/\.(mp4|webm|ogg|mov|m4v|m3u8)$|^(\/uploads\/)/i)
    
    if (isDirectVideo) {
      setPlayerType("video")
      return
    }

    // 2. Handle YouTube
    const ytMatch = currentUrl.match(/(?:\?v=|&v=|youtu\.be\/|\/embed\/|\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`)
      return
    }

    // 3. Handle xHamster
    const xhMatch = currentUrl.match(/xhamster\.com\/videos\/.*-([a-zA-Z0-9]+)/)
    if (xhMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://xhamster.com/embed/${xhMatch[1]}`)
      return
    }

    // 4. Handle Pornhub
    const phMatch = currentUrl.match(/pornhub\.com\/view_video\.php\?viewkey=([a-zA-Z0-9]+)/)
    if (phMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://www.pornhub.com/embed/${phMatch[1]}`)
      return
    }

    // 5. Handle Vimeo
    const vmMatch = currentUrl.match(/vimeo\.com\/(?:video\/)?([0-9]+)/)
    if (vmMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1`)
      return
    }

    if (currentUrl.startsWith("http")) {
      setPlayerType("video")
    } else {
      setError("Unsupported video source")
    }
  }, [currentUrl])

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
    <div className={`relative group h-full w-full bg-black sm:rounded-lg overflow-hidden ${className}`}>
        <video
          ref={videoRef}
          controls
          className="h-full w-full object-contain"
          poster={poster}
          playsInline
          preload="metadata"
        >
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>

        {/* Quality Selector Overlay (YouTube Style) */}
        {qualities.length > 0 && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="flex flex-col gap-1 items-end">
                    <div className="bg-black/80 backdrop-blur-md rounded-lg border border-white/10 p-1 flex flex-col min-w-[80px]">
                        <span className="text-[10px] text-white/50 px-2 py-1 uppercase font-bold">Quality</span>
                        {[{ label: "Auto", url: url }, ...qualities].map((q, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    setCurrentUrl(q.url)
                                    setCurrentQuality(q.label)
                                }}
                                className={`text-[11px] px-3 py-1.5 rounded-md text-left transition-colors ${
                                    currentQuality === q.label 
                                    ? "bg-primary text-white font-bold" 
                                    : "text-white/80 hover:bg-white/10"
                                }`}
                            >
                                {q.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}
