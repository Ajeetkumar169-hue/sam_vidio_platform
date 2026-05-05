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

import { Play, Pause, Volume2, VolumeX, Maximize, Settings, RotateCcw } from "lucide-react"

export function VideoPlayer({ url, poster, className = "", qualities = [] }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playerType, setPlayerType] = useState<"video" | "iframe" | "unknown">("unknown")
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState(url)
  const [currentQuality, setCurrentQuality] = useState("Auto")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    setCurrentUrl(url)
  }, [url])

  useEffect(() => {
    if (!currentUrl || !videoRef.current) return

    const isHLS = currentUrl.includes(".m3u8")
    const video = videoRef.current

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100)
      }
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("timeupdate", handleTimeUpdate)

    if (isHLS) {
        if (Hls.isSupported()) {
            const hls = new Hls()
            hls.loadSource(currentUrl)
            hls.attachMedia(video)
            return () => {
              hls.destroy()
              video.removeEventListener("play", handlePlay)
              video.removeEventListener("pause", handlePause)
              video.removeEventListener("timeupdate", handleTimeUpdate)
            }
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = currentUrl
        }
    } else {
        video.src = currentUrl
    }

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("timeupdate", handleTimeUpdate)
    }
  }, [currentUrl])

  useEffect(() => {
    if (!currentUrl) return
    const isDirectVideo = currentUrl.match(/\.(mp4|webm|ogg|mov|m4v|m3u8|mpd)$|^(\/uploads\/)/i) || 
                         (currentUrl.includes("s3.") && !currentUrl.includes("youtube.com")) ||
                         (currentUrl.includes("digitaloceanspaces.com")) ||
                         (currentUrl.includes("r2.cloudflarestorage.com"))
    
    if (isDirectVideo) {
      setPlayerType("video")
      return
    }

    const ytMatch = currentUrl.match(/(?:\?v=|&v=|youtu\.be\/|\/embed\/|\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/)
    if (ytMatch) {
      setPlayerType("iframe")
      setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`)
      return
    }

    if (currentUrl.startsWith("http")) {
      setPlayerType("video")
    } else {
      setError("Unsupported video source")
    }
  }, [currentUrl])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause()
      else videoRef.current.play().catch(() => {})
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen()
      else if ((videoRef.current as any).webkitRequestFullscreen) (videoRef.current as any).webkitRequestFullscreen()
      else if ((videoRef.current as any).msRequestFullscreen) (videoRef.current as any).msRequestFullscreen()
    }
  }

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
    <div 
      className={`relative group h-full w-full bg-black sm:rounded-lg overflow-hidden ${className}`}
      onMouseMove={() => {
        setShowControls(true)
        // Auto hide controls after 3 seconds
        const timer = setTimeout(() => setShowControls(false), 3000)
        return () => clearTimeout(timer)
      }}
    >
        <video
          ref={videoRef}
          className="h-full w-full object-contain cursor-pointer"
          poster={poster}
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
        />

        {/* Custom Controls Overlay */}
        <div className={`absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? "opacity-100" : "opacity-0"}`}>
          
          {/* Progress Bar */}
          <div className="px-4 mb-2">
            <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress">
              <div 
                className="h-full bg-primary transition-all duration-100" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-4">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
              </button>
              <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
                {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {qualities.length > 0 && (
                <div className="relative group/quality">
                  <button className="text-white hover:text-primary transition-colors flex items-center gap-1">
                    <Settings className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">{currentQuality}</span>
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden group-hover/quality:block bg-black/90 border border-white/10 rounded-lg p-1 min-w-[100px]">
                    {[{ label: "Auto", url: url }, ...qualities].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentUrl(q.url)
                          setCurrentQuality(q.label)
                        }}
                        className={`block w-full text-left px-3 py-1.5 rounded-md text-[11px] transition-colors ${currentQuality === q.label ? "bg-primary text-white" : "text-white/60 hover:bg-white/10"}`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Big Center Play Button (Visible when paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-20 w-20 bg-primary/20 backdrop-blur-md rounded-full flex items-center justify-center border border-primary/30">
              <Play className="h-10 w-10 text-primary fill-current ml-1" />
            </div>
          </div>
        )}
    </div>
  )
}

