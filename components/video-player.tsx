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
      <div className={`flex items-center justify-center bg-secondary/20 rounded-lg border border-dashed border-border/50 ${className}`}>
        <div className="flex flex-col items-center gap-4 text-muted-foreground p-8 text-center max-w-md">
          <div className="p-4 rounded-full bg-destructive/10">
            <AlertCircle className="h-10 w-10 text-destructive/70" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Playback Error</p>
            <p className="text-xs leading-relaxed opacity-70">{error}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { setError(null); setCurrentUrl(url + "?t=" + Date.now()); }}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-full transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry Playback
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-full transition-colors"
            >
              Refresh Page
            </button>
          </div>
          <p className="text-[10px] opacity-50 italic mt-2">
            Tip: If this is a local upload, ensure the server is running and files exist in public/uploads.
          </p>
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
          src={currentUrl}
          className="h-full w-full object-contain cursor-pointer"
          poster={poster}
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          onError={(e) => {
            const video = e.currentTarget;
            let msg = "Unknown error occurred";
            if (video.error) {
              switch (video.error.code) {
                case 1: msg = "Playback aborted by user"; break;
                case 2: msg = "Network error while loading video. Check your connection or S3 permissions."; break;
                case 3: msg = "Video decoding failed (corrupted file or unsupported codec?)"; break;
                case 4: msg = "Video format not supported or source file not found (404)"; break;
              }
            }
            console.error(`❌ [Video Player Error] URL: ${currentUrl}`, msg, video.error);
            setError(`${msg} (URL: ${currentUrl})`);
          }}
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

