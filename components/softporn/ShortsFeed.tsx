"use client"

import { useState, useEffect, useRef } from "react"
import { ThumbsUp, MessageSquare, Share2, Loader2, Zap, Tag, Trash2, DownloadCloud } from "lucide-react"
import Hls from "hls.js"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ShareDialog } from "@/components/share-dialog"
import { DownloadButton } from "@/components/download-button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CommentsSection } from "@/components/comments-section"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCallback } from "react"

interface Short {
  _id: string
  title: string
  description: string
  videoUrl: string
  likes: number
  uploader: string
  channel: {
    name: string
    slug: string
    logo?: string
  }
}

export function ShortsFeed() {
  const { user } = useAuth()
  const router = useRouter()
  const [shorts, setShorts] = useState<Short[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedStatus, setLikedStatus] = useState<Record<string, { liked: boolean, disliked: boolean, likes: number }>>({})
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentShortId, setCommentShortId] = useState<string | null>(null)
  const [subscribedStatus, setSubscribedStatus] = useState<Record<string, boolean>>({})
  const lastScrollTop = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)

  const showNavbars = useCallback(() => {
    // Dispatch event to show navbars (hideNavs = false)
    window.dispatchEvent(new CustomEvent("toggle-navs", { detail: false }))
    
    // Clear existing timer
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    
    // Set new timer to hide after 3 seconds
    hideTimerRef.current = setTimeout(() => {
      // Only hide if we are on mobile/small screens
      if (window.innerWidth < 1024) {
        window.dispatchEvent(new CustomEvent("toggle-navs", { detail: true }))
      }
    }, 3000)
  }, [])

  useEffect(() => {
    showNavbars()
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [currentIndex, showNavbars])

  useEffect(() => {
    fetch("/api/videos?isShort=true&limit=10")
      .then(res => res.json())
      .then(data => {
        const videos = data.data.videos || []
        setShorts(videos)
        
        // Initialize like status
        const status: Record<string, { liked: boolean, disliked: boolean, likes: number }> = {}
        videos.forEach((v: Short) => {
          status[v._id] = { liked: false, disliked: false, likes: v.likes }
        })
        setLikedStatus(status)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, clientHeight } = containerRef.current
    
    // Auto-show/reset timer on scroll/swipe
    showNavbars()
    
    lastScrollTop.current = scrollTop

    const index = Math.round(scrollTop / clientHeight)
    if (index !== currentIndex) {
      setCurrentIndex(index)
    }
  }

  const handleLike = async (videoId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    const prevStatus = likedStatus[videoId] || { liked: false, disliked: false, likes: 0 }
    
    // Optimistic Update
    setLikedStatus(prev => ({
        ...prev,
        [videoId]: {
            liked: !prevStatus.liked,
            disliked: !prevStatus.liked ? false : prevStatus.disliked,
            likes: prevStatus.liked ? Math.max(0, prevStatus.likes - 1) : prevStatus.likes + 1
        }
    }))

    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" })
      })
      const data = await res.json()
      setLikedStatus(prev => ({
        ...prev,
        [videoId]: {
          liked: data.liked,
          disliked: data.disliked,
          likes: data.likes
        }
      }))
    } catch {
      toast.error("Failed to like")
      // Revert
      setLikedStatus(prev => ({ ...prev, [videoId]: prevStatus }))
    }
  }

  const handleDislike = async (videoId: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    const prevStatus = likedStatus[videoId] || { liked: false, disliked: false, likes: 0 }
    
    // Optimistic Update
    setLikedStatus(prev => ({
        ...prev,
        [videoId]: {
            disliked: !prevStatus.disliked,
            liked: !prevStatus.disliked ? false : prevStatus.liked,
            likes: (!prevStatus.disliked && prevStatus.liked) ? Math.max(0, prevStatus.likes - 1) : prevStatus.likes
        }
    }))

    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "dislike" })
      })
      const data = await res.json()
      setLikedStatus(prev => ({
        ...prev,
        [videoId]: {
          liked: data.liked,
          disliked: data.disliked,
          likes: data.likes
        }
      }))
    } catch {
      toast.error("Failed to dislike")
      // Revert
      setLikedStatus(prev => ({ ...prev, [videoId]: prevStatus }))
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to delete this short?")) return
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Short deleted")
      setShorts(prev => prev.filter(s => s._id !== videoId))
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleSubscribe = async (channelSlug: string) => {
    if (!user) {
      router.push("/login")
      return
    }

    const isCurrentlySubscribed = subscribedStatus[channelSlug]
    
    // Optimistic Update
    setSubscribedStatus(prev => ({ ...prev, [channelSlug]: !isCurrentlySubscribed }))

    try {
      const res = await fetch(`/api/channels/${channelSlug}/subscribe`, { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setSubscribedStatus(prev => ({ ...prev, [channelSlug]: data.subscribed }))
        toast.success(data.subscribed ? "Subscribed!" : "Unsubscribed")
      }
    } catch {
      toast.error("Action failed")
      setSubscribedStatus(prev => ({ ...prev, [channelSlug]: isCurrentlySubscribed }))
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center gap-4">
        <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center">
            <Zap className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-xl font-bold">No Shorts found</p>
        <p className="text-muted-foreground">Be the first to upload one!</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      onClick={showNavbars}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-background"
    >
      {shorts.map((short, index) => (
        <div 
          key={short._id} 
          className="h-full w-full snap-start relative flex items-center justify-center"
        >
          <div className="h-full aspect-[9/16] relative bg-background shadow-2xl">
            <ShortPlayer src={short.videoUrl} isActive={index === currentIndex} />

            {/* UI Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              
              <div className="flex flex-row justify-between items-end gap-4">
                {/* Info & Actions */}
                <div className="flex-1 pb-4 text-left flex flex-col items-start gap-4">
                   <div className="flex items-center justify-start gap-2 mb-1">
                      <Link href={`/channel/${short.channel.slug}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="h-9 w-9 rounded-full bg-primary overflow-hidden border border-white/20">
                            {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-sm bg-secondary">{short.channel.name[0]}</div>}
                        </div>
                        <p className="font-bold text-white text-sm">@{short.channel.slug}</p>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={() => handleSubscribe(short.channel.slug)}
                        className={cn(
                            "h-8 rounded-full font-bold px-4 ml-2 transition-all",
                            subscribedStatus[short.channel.slug] 
                                ? "bg-secondary text-foreground hover:bg-secondary/80" 
                                : "bg-white text-black hover:bg-white/90"
                        )}
                      >
                        {subscribedStatus[short.channel.slug] ? "Subscribed" : "Subscribe"}
                      </Button>
                   </div>
                   
                   <div className="space-y-2 flex flex-col items-start">
                      <h3 className="font-medium text-white text-base leading-snug line-clamp-2 max-w-[80%] mb-2">{short.title}</h3>
                   </div>
                </div>

                {/* Right Actions Sidebar */}
                <div className="flex flex-col gap-5 items-center mb-4 pr-3">
                    {/* Like */}
                    <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => handleLike(short._id)}
                          className={cn(
                            "h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
                            likedStatus[short._id]?.liked ? "bg-primary text-white" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                            <ThumbsUp className={cn("h-5 w-5", likedStatus[short._id]?.liked && "fill-current")} />
                        </button>
                        <span className="text-[10px] font-bold text-white">{formatNumber(likedStatus[short._id]?.likes || short.likes)}</span>
                    </div>

                    {/* Dislike */}
                    <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => handleDislike(short._id)}
                          className={cn(
                            "h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
                            likedStatus[short._id]?.disliked ? "bg-destructive text-white" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                            <ThumbsUp className={cn("h-5 w-5 rotate-180", likedStatus[short._id]?.disliked && "fill-current")} />
                        </button>
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Dislike</span>
                    </div>

                    {/* Delete (Only for Owner/Admin) */}
                    {(user?.id === short.uploader || user?.role === "admin") && (
                      <div className="flex flex-col items-center gap-1">
                          <button 
                            onClick={() => handleDelete(short._id)}
                            className="h-10 w-10 rounded-full bg-destructive/10 backdrop-blur-md flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                          >
                              <Trash2 className="h-5 w-5" />
                          </button>
                          <span className="text-[10px] font-bold text-destructive uppercase tracking-tighter">Delete</span>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => {
                            setCommentShortId(short._id)
                            setCommentOpen(true)
                          }}
                          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <MessageSquare className="h-5 w-5 text-white" />
                        </button>
                        <span className="text-[10px] font-bold text-white">Comments</span>
                    </div>

                    {/* Share */}
                    <div className="flex flex-col items-center gap-1">
                        <ShareDialog 
                          videoId={short._id} 
                          title={short.title} 
                          trigger={
                            <button className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Share2 className="h-5 w-5 text-white" />
                            </button>
                          }
                        />
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Share</span>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}

      {/* Real-time Comments Drawer */}
      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent className="max-h-[80vh] bg-background border-t border-white/10">
          <DrawerHeader className="border-b border-white/5 pb-2">
            <DrawerTitle>Comments</DrawerTitle>
            <DrawerDescription>View and post comments on this short</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {commentShortId && (
              <CommentsSection videoId={commentShortId} />
            )}
          </div>
          <DrawerFooter className="pt-0">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function ShortPlayer({ src, isActive }: { src: string, isActive: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false) // User requested unmuted by default

  const isStreamtape = src.includes("streamtape.com/")
  let embedUrl = src
  if (isStreamtape) {
    const stMatch = src.match(/streamtape\.com\/(?:v|e)\/([a-zA-Z0-9_-]+)/)
    if (stMatch) {
      embedUrl = `https://streamtape.com/e/${stMatch[1]}?autoplay=1`
    }
  }

  useEffect(() => {
    if (isStreamtape) return // Handled by iframe
    if (!src || !videoRef.current) return
    const video = videoRef.current
    const isHLS = src.includes(".m3u8")

    if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        return () => hls.destroy()
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src
      }
    } else {
      video.src = src
    }
  }, [src, isStreamtape])

  // Handle Play/Pause based on Active State
  useEffect(() => {
    if (isStreamtape) return
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.muted = isMuted // ensure video element matches state before playing
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser still blocks, force mute
          setIsMuted(true)
          video.muted = true
          video.play().catch(() => {})
        })
      }
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive, isStreamtape, isMuted])

  // Toggle mute on tap
  const toggleMute = () => {
    setIsMuted(prev => !prev)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  if (isStreamtape) {
    return (
      <iframe
        src={embedUrl}
        className="h-full w-full border-none pointer-events-none"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    )
  }

  return (
    <div className="relative h-full w-full group cursor-pointer" onClick={toggleMute}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          loop
          playsInline
          autoPlay={isActive}
          muted={isMuted}
        />
        {isMuted && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full pointer-events-none animate-pulse">
                <p className="text-white font-bold text-xs">Tap to Unmute</p>
            </div>
        )}
    </div>
  )
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

