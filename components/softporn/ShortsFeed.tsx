"use client"

import { useState, useEffect, useRef } from "react"
import { ThumbsUp, MessageSquare, Share2, Loader2, Zap, Tag, Trash2, DownloadCloud, Play, Pause } from "lucide-react"
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const lastScrollTop = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const viewedShorts = useRef<Set<string>>(new Set())

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

  // Increment View Count for active short
  useEffect(() => {
    if (shorts.length > 0 && shorts[currentIndex]) {
      const activeShortId = shorts[currentIndex]._id
      if (!viewedShorts.current.has(activeShortId)) {
        viewedShorts.current.add(activeShortId)
        fetch(`/api/videos/${activeShortId}/view`, { method: "POST" })
          .catch(err => console.error("Short view increment failed:", err))
      }
    }
  }, [currentIndex, shorts])

  useEffect(() => {
    fetch("/api/videos?isShort=true&limit=15")
      .then(res => res.json())
      .then(async (data) => {
        const videos = data.data.videos || []
        setShorts(videos)
        
        // Initialize like status from basic data
        const status: Record<string, { liked: boolean, disliked: boolean, likes: number }> = {}
        const subStatus: Record<string, boolean> = {}
        
        videos.forEach((v: Short) => {
          status[v._id] = { liked: false, disliked: false, likes: v.likes }
        })
        setLikedStatus(status)

        // If user is logged in, fetch real interaction status
        if (user) {
          const videoIds = videos.map((v: Short) => v._id)
          const slugs = Array.from(new Set(videos.map((v: Short) => v.channel.slug)))
          
          // Fetch likes status in batch (or individually if no batch API)
          for (const id of videoIds) {
             fetch(`/api/videos/${id}/like`)
               .then(res => res.json())
               .then(data => {
                  setLikedStatus(prev => ({
                    ...prev,
                    [id as string]: { ...prev[id as string], liked: data.liked, disliked: data.disliked }
                  }))
               }).catch(() => {})
          }

          // Fetch subscription status for channels
          for (const slug of slugs) {
             fetch(`/api/channels/${slug}/subscribe`)
               .then(res => res.json())
               .then(data => {
                  setSubscribedStatus(prev => ({ ...prev, [slug as string]: data.subscribed }))
               }).catch(() => {})
          }
        }
        
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [user])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute("data-index") || "0")
            setCurrentIndex(index)
          }
        })
      },
      { 
        threshold: 0.5,
        rootMargin: "100px" // Load videos slightly before they come into view
      }
    )

    const timer = setTimeout(() => {
        const elements = document.querySelectorAll(".short-item")
        elements.forEach((el) => observer.observe(el))
        // Force check the first item
        if (elements.length > 0 && currentIndex === 0) {
            setCurrentIndex(0)
        }
    }, 100)

    return () => {
        observer.disconnect()
        clearTimeout(timer)
    }
  }, [shorts.length])

  const lastToggleTime = useRef(0)
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop } = containerRef.current
    const now = Date.now()

    // Throttle the toggle-navs event to once every 200ms
    if (now - lastToggleTime.current > 200) {
        if (scrollTop > lastScrollTop.current + 100) {
            window.dispatchEvent(new CustomEvent("toggle-navs", { detail: true }))
            lastToggleTime.current = now
        } else if (scrollTop < lastScrollTop.current - 100) {
            window.dispatchEvent(new CustomEvent("toggle-navs", { detail: false }))
            lastToggleTime.current = now
        }
    }
    lastScrollTop.current = scrollTop
  }

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!containerRef.current) return
        if (e.key === "ArrowDown") {
            containerRef.current.scrollBy({ top: window.innerHeight, behavior: "smooth" })
        } else if (e.key === "ArrowUp") {
            containerRef.current.scrollBy({ top: -window.innerHeight, behavior: "smooth" })
        }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const scrollNext = () => {
    containerRef.current?.scrollBy({ top: window.innerHeight, behavior: "smooth" })
  }

  const scrollPrev = () => {
    containerRef.current?.scrollBy({ top: -window.innerHeight, behavior: "smooth" })
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
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-[#050505]"
    >
      {shorts.map((short, index) => (
        <div 
          key={short._id} 
          data-index={index}
          className="short-item h-full w-full snap-start snap-always relative flex items-center justify-center bg-black"
        >
          {/* Optimized PC Background (Low GPU cost) */}
          <div className="absolute inset-0 hidden lg:block overflow-hidden opacity-20 pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-black to-black" />
          </div>

          <div className="h-full w-full lg:h-[95vh] lg:aspect-[9/16] lg:rounded-3xl relative bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5">
            {/* Desktop Navigation Arrows */}
            <div className="absolute left-full ml-6 bottom-1/2 translate-y-1/2 hidden lg:flex flex-col gap-6 z-50">
                <button 
                  onClick={(e) => { e.stopPropagation(); scrollPrev(); }} 
                  className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary/20 backdrop-blur-xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/10 hover:border-primary/50 group"
                >
                    <Zap className="h-6 w-6 rotate-180 group-hover:scale-125 transition-transform" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); scrollNext(); }} 
                  className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary/20 backdrop-blur-xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/10 hover:border-primary/50 group"
                >
                    <Zap className="h-6 w-6 group-hover:scale-125 transition-transform" />
                </button>
            </div>

            <ShortPlayer 
                src={short.videoUrl} 
                poster={short.videoUrl.replace(/\.[^/.]+$/, ".jpg")}
                isActive={index === currentIndex} 
                isNext={index === currentIndex + 1} // Reduced preloading for performance
            />

            {/* UI Overlay - Using pointer-events-none on parent, auto on children */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 pb-8 md:p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none">
              
              <div className="flex flex-row justify-between items-end gap-4 pointer-events-auto">
                {/* Info & Actions */}
                <div className="flex-1 pb-4 text-left flex flex-col items-start gap-4">
                   <div className="flex items-center justify-start gap-2 mb-1">
                      <Link 
                        href={`/channel/${short.channel.slug}`} 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 hover:opacity-80 transition-all active:scale-95 z-50"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary overflow-hidden border-2 border-white/20 shadow-lg">
                            {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-sm bg-secondary">{short.channel.name[0]}</div>}
                        </div>
                        <div className="flex flex-col">
                           <p className="font-black text-white text-sm shadow-sm">@{short.channel.slug}</p>
                           <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">{short.channel.name}</p>
                        </div>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSubscribe(short.channel.slug)
                        }}
                        className={cn(
                            "h-9 rounded-full font-black px-6 ml-4 transition-all active:scale-90 shadow-xl z-50 uppercase tracking-widest text-[10px]",
                            subscribedStatus[short.channel.slug] 
                                ? "bg-white/20 text-white backdrop-blur-md hover:bg-white/30 border border-white/10" 
                                : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                        )}
                      >
                        {subscribedStatus[short.channel.slug] ? "Subscribed" : "Subscribe"}
                      </Button>
                   </div>
                   
                   <div className="space-y-2 flex flex-col items-start w-full">
                      <div className="flex items-center gap-2 max-w-full">
                          <h3 className="font-bold text-white text-lg leading-tight truncate mb-1 drop-shadow-md">
                              {short.title}
                          </h3>
                          {short.description && (
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setExpandedId(expandedId === short._id ? null : short._id)
                                }}
                                className="text-[9px] font-black text-white/90 hover:text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg shrink-0 border border-white/10"
                              >
                                  {expandedId === short._id ? "LESS" : "MORE"}
                              </button>
                          )}
                      </div>
                      {expandedId === short._id && short.description && (
                          <div className="text-xs text-white/90 bg-black/80 p-4 rounded-2xl backdrop-blur-xl mb-2 max-h-40 overflow-y-auto w-[95%] border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2 duration-300">
                              {short.description}
                          </div>
                      )}
                   </div>
                </div>

                {/* Right Actions Sidebar */}
                <div className="flex flex-col gap-6 items-center mb-4 pr-1">
                    {/* Like */}
                    <div className="flex flex-col items-center gap-1.5 group">
                        <button 
                          onClick={(e) => {
                             e.stopPropagation()
                             handleLike(short._id)
                          }}
                          className={cn(
                            "h-12 w-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all active:scale-75 shadow-xl border border-white/10",
                            likedStatus[short._id]?.liked ? "bg-primary text-white border-primary" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                            <ThumbsUp className={cn("h-6 w-6 transition-transform group-hover:scale-110", likedStatus[short._id]?.liked && "fill-current")} />
                        </button>
                        <span className="text-[11px] font-black text-white drop-shadow-lg">{formatNumber(likedStatus[short._id]?.likes || short.likes)}</span>
                    </div>

                    {/* Dislike */}
                    <div className="flex flex-col items-center gap-1.5 group">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDislike(short._id)
                          }}
                          className={cn(
                            "h-12 w-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all active:scale-75 shadow-xl border border-white/10",
                            likedStatus[short._id]?.disliked ? "bg-white text-black border-white" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                            <ThumbsUp className={cn("h-6 w-6 rotate-180 transition-transform group-hover:scale-110", likedStatus[short._id]?.disliked && "fill-current")} />
                        </button>
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter drop-shadow-lg">Dislike</span>
                    </div>

                    {/* Delete (Only for Owner/Admin) */}
                    {(user?.id === short.uploader || user?.role === "admin") && (
                      <div className="flex flex-col items-center gap-1.5 group">
                          <button 
                            onClick={(e) => {
                               e.stopPropagation()
                               handleDelete(short._id)
                            }}
                            className="h-12 w-12 rounded-full bg-destructive/20 backdrop-blur-xl flex items-center justify-center text-destructive hover:bg-destructive/40 transition-all active:scale-75 border border-destructive/20 shadow-xl"
                          >
                              <Trash2 className="h-6 w-6" />
                          </button>
                          <span className="text-[10px] font-black text-destructive/80 uppercase tracking-tighter drop-shadow-lg">Delete</span>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="flex flex-col items-center gap-1.5 group">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setCommentShortId(short._id)
                            setCommentOpen(true)
                          }}
                          className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-75 shadow-xl border border-white/10"
                        >
                            <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                        </button>
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter drop-shadow-lg">Chat</span>
                    </div>

                    {/* Share */}
                    <div className="flex flex-col items-center gap-1.5 group">
                        <ShareDialog 
                          videoId={short._id} 
                          title={short.title} 
                          trigger={
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-75 shadow-xl border border-white/10"
                            >
                                <Share2 className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                            </button>
                          }
                        />
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter drop-shadow-lg">Share</span>
                    </div>

                    {/* Download */}
                    <div className="flex flex-col items-center gap-1.5 group">
                        <DownloadButton 
                          video={short as any} 
                          trigger={
                            <button 
                                onClick={(e) => e.stopPropagation()}
                                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-all active:scale-75 shadow-xl border border-white/10"
                            >
                                <DownloadCloud className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
                            </button>
                          }
                        />
                        <span className="text-[10px] font-black text-white/80 uppercase tracking-tighter drop-shadow-lg">Save</span>
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}

      {/* Real-time Comments Drawer */}
      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent className="max-h-[80vh] bg-[#0A0A0A] border-t border-white/10 text-white rounded-t-[2.5rem]">
          <DrawerHeader className="border-b border-white/5 pb-4">
            <DrawerTitle className="text-xl font-black italic uppercase tracking-tight">Community Chat</DrawerTitle>
            <DrawerDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Join the conversation about this short</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto platinum-scrollbar">
            {commentShortId && (
              <CommentsSection videoId={commentShortId} />
            )}
          </div>
          <DrawerFooter className="pt-2 border-t border-white/5">
            <DrawerClose asChild>
              <Button variant="ghost" className="rounded-2xl h-12 font-bold hover:bg-white/5">Close Discussion</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

import { memo } from "react"

const ShortPlayer = memo(function ShortPlayer({ src, poster, isActive, isNext }: { src: string, poster?: string, isActive: boolean, isNext?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showIcon, setShowIcon] = useState<"play" | "pause" | "volume" | "mute" | null>(null)
  const iconTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hasError, setHasError] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const isStreamtape = src.includes("streamtape.com/")
  let embedUrl = src
  if (isStreamtape) {
    const stMatch = src.match(/streamtape\.com\/(?:v|e)\/([a-zA-Z0-9_-]+)/)
    if (stMatch) {
      embedUrl = `https://streamtape.com/e/${stMatch[1]}?autoplay=1`
    }
  }

  useEffect(() => {
    const checkCache = async () => {
      if (isStreamtape || !src || !videoRef.current) return
      
      try {
        const cache = await caches.open("video-downloads-v1")
        const cachedResponse = await cache.match(src)
        if (cachedResponse) {
          const blob = await cachedResponse.blob()
          const objectUrl = URL.createObjectURL(blob)
          if (videoRef.current) {
            videoRef.current.src = objectUrl
          }
          return () => URL.revokeObjectURL(objectUrl)
        }
      } catch (e) {
        console.error("Cache check failed in Shorts:", e)
      }
    }
    checkCache()
  }, [src, isStreamtape])

  useEffect(() => {
    if (isStreamtape) return
    if (!src || !videoRef.current) return
    
    if (!isActive && !isNext) {
        if (videoRef.current.src) {
            videoRef.current.src = ""
            videoRef.current.load()
        }
        return
    }

    const video = videoRef.current
    if (video.src.startsWith("blob:")) return

    const isHLS = src.includes(".m3u8")

    if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 30,
            maxBufferLength: 10,
            maxMaxBufferLength: 20,
            autoStartLoad: isActive,
        })
        hls.loadSource(src)
        hls.attachMedia(video)
        
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break
                    case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break
                    default: hls.destroy(); setHasError(true); break
                }
            }
        })

        return () => hls.destroy()
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src
      }
    } else {
      video.src = src
    }
  }, [src, isStreamtape, isActive, isNext])

  useEffect(() => {
    if (isStreamtape) return
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      setHasError(false)
      video.muted = isMuted
      video.play().catch(() => {
          video.muted = true
          setIsMuted(true)
          setNeedsInteraction(true)
          video.play().catch(() => {})
      })
    } else {
      video.pause()
      video.currentTime = 0
    }
  }, [isActive, isStreamtape, isMuted, needsInteraction])

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().then(() => {
        setIsPaused(false)
        triggerIcon("play")
      }).catch(() => {})
    } else {
      video.pause()
      setIsPaused(true)
      triggerIcon("pause")
    }
  }

  const triggerIcon = (type: "play" | "pause") => {
    setShowIcon(type)
    if (iconTimeoutRef.current) clearTimeout(iconTimeoutRef.current)
    iconTimeoutRef.current = setTimeout(() => setShowIcon(null), 800)
  }

  return (
    <div className="relative h-full w-full group cursor-pointer bg-black overflow-hidden" onClick={handleInteraction}>
        {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-20">
                <Zap className="h-12 w-12 text-primary animate-pulse" />
                <h3 className="text-white font-black italic uppercase">Playback Error</h3>
                <Button variant="secondary" className="rounded-2xl font-bold" onClick={() => window.location.reload()}>Retry</Button>
            </div>
        ) : (
            <>
                <video
                  ref={videoRef}
                  className="h-full w-full object-contain md:object-cover"
                  poster={poster}
                  loop
                  playsInline
                  autoPlay={isActive}
                  muted={true}
                  preload="metadata"
                  onLoadStart={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                  onError={() => setHasError(true)}
                />
                
                {isLoading && isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                )}

                <div 
                    className="absolute inset-0 z-[5]" 
                    onClick={handleInteraction} 
                />
            </>
        )}
        
        {showIcon && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-xl p-8 rounded-full animate-out fade-out zoom-out duration-700 pointer-events-none z-50 shadow-2xl border border-white/10">
                {showIcon === "play" ? (
                    <Play className="h-12 w-12 text-white fill-current" />
                ) : (
                    <Pause className="h-12 w-12 text-white fill-current" />
                )}
            </div>
        )}

        {needsInteraction && isActive && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-md">
                <Button 
                    variant="default" 
                    className="rounded-full font-black h-16 px-8 shadow-2xl shadow-primary/40 animate-bounce bg-primary text-white uppercase italic tracking-wider border-none"
                    onClick={(e) => {
                        e.stopPropagation()
                        const video = videoRef.current
                        if (video) {
                            video.muted = false
                            setIsMuted(false)
                            setNeedsInteraction(false)
                            video.play().catch(() => {})
                        }
                    }}
                >
                    <Play className="h-6 w-6 mr-3 fill-current" />
                    Unmute & Play
                </Button>
            </div>
        )}
    </div>
  )
})

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

