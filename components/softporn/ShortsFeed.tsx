"use client"

import { useState, useEffect, useRef, memo, useCallback } from "react"
import { ThumbsUp, MessageSquare, Share2, Loader2, Zap, Trash2, DownloadCloud, Play, Pause } from "lucide-react"
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
} from "@/components/ui/drawer"
import { CommentsSection } from "@/components/comments-section"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
    window.dispatchEvent(new CustomEvent("toggle-navs", { detail: false }))
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => {
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
        const status: Record<string, { liked: boolean, disliked: boolean, likes: number }> = {}
        videos.forEach((v: Short) => {
          status[v._id] = { liked: false, disliked: false, likes: v.likes }
        })
        setLikedStatus(status)

        if (user) {
          const videoIds = videos.map((v: Short) => v._id)
          const slugs = Array.from(new Set(videos.map((v: Short) => v.channel.slug)))
          for (const id of videoIds) {
            fetch(`/api/videos/${id}/like`)
              .then(res => res.json())
              .then(data => {
                setLikedStatus(prev => ({
                  ...prev,
                  [id as string]: { ...prev[id as string], liked: data.liked, disliked: data.disliked }
                }))
              }).catch(() => { })
          }
          for (const slug of slugs) {
            fetch(`/api/channels/${slug}/subscribe`)
              .then(res => res.json())
              .then(data => {
                setSubscribedStatus(prev => ({ ...prev, [slug as string]: data.subscribed }))
              }).catch(() => { })
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
      { threshold: 0.5, rootMargin: "100px" }
    )
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll(".short-item")
      elements.forEach((el) => observer.observe(el))
      if (elements.length > 0 && currentIndex === 0) setCurrentIndex(0)
    }, 100)
    return () => {
      observer.disconnect()
      clearTimeout(timer)
    }
  }, [shorts.length])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop } = containerRef.current
    if (Math.abs(scrollTop - lastScrollTop.current) > 100) {
      window.dispatchEvent(new CustomEvent("toggle-navs", { detail: scrollTop > lastScrollTop.current }))
      lastScrollTop.current = scrollTop
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return
      if (e.key === "ArrowDown") containerRef.current.scrollBy({ top: window.innerHeight, behavior: "smooth" })
      else if (e.key === "ArrowUp") containerRef.current.scrollBy({ top: -window.innerHeight, behavior: "smooth" })
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const scrollNext = () => containerRef.current?.scrollBy({ top: window.innerHeight, behavior: "smooth" })
  const scrollPrev = () => containerRef.current?.scrollBy({ top: -window.innerHeight, behavior: "smooth" })

  const handleLike = async (videoId: string) => {
    if (!user) { router.push("/login"); return }
    const prevStatus = likedStatus[videoId] || { liked: false, disliked: false, likes: 0 }
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
      setLikedStatus(prev => ({ ...prev, [videoId]: { liked: data.liked, disliked: data.disliked, likes: data.likes } }))
    } catch {
      toast.error("Failed to like")
      setLikedStatus(prev => ({ ...prev, [videoId]: prevStatus }))
    }
  }

  const handleDislike = async (videoId: string) => {
    if (!user) { router.push("/login"); return }
    const prevStatus = likedStatus[videoId] || { liked: false, disliked: false, likes: 0 }
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
      setLikedStatus(prev => ({ ...prev, [videoId]: { liked: data.liked, disliked: data.disliked, likes: data.likes } }))
    } catch {
      toast.error("Failed to dislike")
      setLikedStatus(prev => ({ ...prev, [videoId]: prevStatus }))
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!window.confirm("Are you sure?")) return
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Deleted")
      setShorts(prev => prev.filter(s => s._id !== videoId))
    } catch (err: any) { toast.error(err.message) }
  }

  const handleSubscribe = async (slug: string) => {
    if (!user) { router.push("/login"); return }
    const isSub = subscribedStatus[slug]
    setSubscribedStatus(prev => ({ ...prev, [slug]: !isSub }))
    try {
      const res = await fetch(`/api/channels/${slug}/subscribe`, { method: "POST" })
      const data = await res.json()
      if (data.subscribed !== undefined) setSubscribedStatus(prev => ({ ...prev, [slug]: data.subscribed }))
    } catch { setSubscribedStatus(prev => ({ ...prev, [slug]: isSub })) }
  }

  function renderSidebarActions(short: Short) {
    return (
      <div className="flex flex-col gap-5 items-center">
        {/* Like */}
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <button 
            onClick={(e) => { e.stopPropagation(); handleLike(short._id) }} 
            className={cn(
              "h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 hover:bg-white/20 border border-white/5 shadow-lg",
              likedStatus[short._id]?.liked ? "bg-primary text-white border-primary" : "text-white"
            )}
          >
            <ThumbsUp className={cn("h-6 w-6", likedStatus[short._id]?.liked && "fill-current")} />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">{formatNumber(likedStatus[short._id]?.likes || short.likes)}</span>
        </div>

        {/* Dislike */}
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <button 
            onClick={(e) => { e.stopPropagation(); handleDislike(short._id) }} 
            className={cn(
              "h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center transition-all active:scale-75 hover:bg-white/20 border border-white/5 shadow-lg",
              likedStatus[short._id]?.disliked ? "bg-white text-black border-white" : "text-white"
            )}
          >
            <ThumbsUp className="h-6 w-6 rotate-180" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Dislike</span>
        </div>

        {/* Comments */}
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <button 
            onClick={(e) => { e.stopPropagation(); setCommentShortId(short._id); setCommentOpen(true) }} 
            className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all border border-white/5 shadow-lg"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </button>
          <span className="text-[11px] font-bold text-white drop-shadow-md">Chat</span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center gap-1 group cursor-pointer">
          <ShareDialog 
            videoId={short._id} 
            title={short.title} 
            trigger={
              <button onClick={(e) => e.stopPropagation()} className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 border border-white/5 shadow-lg">
                <Share2 className="h-6 w-6 text-white" />
              </button>
            } 
          />
          <span className="text-[11px] font-bold text-white drop-shadow-md">Share</span>
        </div>

        {/* Delete (Only for Admin) */}
        {(user?.id === short.uploader || user?.role === "admin") && (
          <div className="flex flex-col items-center gap-1 group cursor-pointer">
            <button 
              onClick={(e) => { e.stopPropagation(); handleDelete(short._id) }} 
              className="h-12 w-12 rounded-full bg-destructive/20 backdrop-blur-md flex items-center justify-center text-destructive border border-destructive/20 shadow-lg hover:bg-destructive/40"
            >
              <Trash2 className="h-6 w-6" />
            </button>
            <span className="text-[11px] font-bold text-destructive/80 drop-shadow-md">Delete</span>
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div ref={containerRef} onScroll={handleScroll} className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar bg-black">
      {shorts.map((short, index) => (
        <div key={short._id} data-index={index} className="short-item h-full w-full snap-start snap-always relative flex items-center justify-center bg-black">
          {/* Desktop Background Glow */}
          <div className="absolute inset-0 hidden lg:block opacity-30 bg-gradient-to-br from-primary/10 via-black to-black" />
          
          <div className="h-full w-full lg:h-[92vh] lg:aspect-[9/16] lg:rounded-[2.5rem] relative bg-black overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] border border-white/5 z-20">
            <ShortPlayer src={short.videoUrl} poster={short.videoUrl.replace(/\.[^/.]+$/, ".jpg")} isActive={index === currentIndex} isNext={index === currentIndex + 1} />
            
            {/* Bottom Info Overlay */}
            <div className="absolute inset-x-0 bottom-0 z-30 p-4 md:p-6 pb-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
              <div className="flex flex-col gap-4 pointer-events-auto">
                {/* Admin Row: DP + Name + Subscribe */}
                <div className="flex items-center gap-3">
                  <Link href={`/channel/${short.channel.slug}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 group">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary overflow-hidden border-2 border-white/20 shadow-xl group-hover:scale-105 transition-transform">
                      {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-sm bg-secondary">{short.channel.name[0]}</div>}
                    </div>
                    <span className="font-bold text-white text-base drop-shadow-lg tracking-tight">@{short.channel.slug}</span>
                  </Link>
                  <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleSubscribe(short.channel.slug) }} 
                    className={cn(
                      "h-9 rounded-full font-black px-6 ml-2 uppercase text-[11px] tracking-widest shadow-xl transition-all active:scale-95",
                      subscribedStatus[short.channel.slug] ? "bg-white/10 text-white backdrop-blur-md border border-white/10" : "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {subscribedStatus[short.channel.slug] ? "Subscribed" : "Subscribe"}
                  </Button>
                </div>

                {/* Title and More Toggle */}
                <div className="space-y-2 max-w-[90%]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-lg leading-tight truncate drop-shadow-md">{short.title}</h3>
                    {short.description && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === short._id ? null : short._id) }}
                        className="text-[10px] font-black text-white/60 hover:text-white uppercase tracking-widest transition-colors"
                      >
                        {expandedId === short._id ? "Less" : "...more"}
                      </button>
                    )}
                  </div>
                  {expandedId === short._id && short.description && (
                    <div className="text-xs text-white/90 bg-black/80 p-4 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2 duration-300 max-h-32 overflow-y-auto platinum-scrollbar">
                      {short.description}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Actions Sidebar (Hidden on LG) */}
            <div className="absolute right-2 bottom-32 flex lg:hidden flex-col gap-6 items-center z-40 pointer-events-auto">
              {renderSidebarActions(short)}
            </div>
          </div>

          {/* PC Actions Sidebar (Outside Frame) */}
          <div className="hidden lg:flex flex-col gap-6 items-center absolute left-[calc(50%+max(30vh,300px))] bottom-10 z-50 animate-in fade-in slide-in-from-right-10 duration-700 delay-300">
            {renderSidebarActions(short)}
          </div>

          {/* Navigation Arrows */}
          <div className="fixed right-10 bottom-1/2 translate-y-1/2 hidden xl:flex flex-col gap-10 z-[60] pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); scrollPrev(); }} className="h-16 w-16 rounded-full bg-white/5 hover:bg-primary/20 backdrop-blur-3xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/10 hover:border-primary/50 group"><Zap className="h-8 w-8 rotate-180 group-hover:scale-125 transition-transform" /></button>
            <button onClick={(e) => { e.stopPropagation(); scrollNext(); }} className="h-16 w-16 rounded-full bg-white/5 hover:bg-primary/20 backdrop-blur-3xl flex items-center justify-center text-white transition-all shadow-2xl border border-white/10 hover:border-primary/50 group"><Zap className="h-8 w-8 group-hover:scale-125 transition-transform" /></button>
          </div>
        </div>
      ))}
      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent className="max-h-[80vh] bg-black border-t border-white/10 text-white rounded-t-[2.5rem]">
          <DrawerHeader className="border-b border-white/5 pb-4">
            <DrawerTitle className="text-xl font-black italic uppercase tracking-tight">Community Chat</DrawerTitle>
            <DrawerDescription className="text-white/40 font-bold uppercase text-[10px] tracking-widest">Join the conversation about this short</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto platinum-scrollbar">{commentShortId && <CommentsSection videoId={commentShortId} />}</div>
          <DrawerFooter className="pt-2 border-t border-white/5"><DrawerClose asChild><Button variant="ghost" className="rounded-2xl h-12 font-bold hover:bg-white/5">Close Discussion</Button></DrawerClose></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

const ShortPlayer = memo(function ShortPlayer({ src, poster, isActive, isNext }: { src: string, poster?: string, isActive: boolean, isNext?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [showIcon, setShowIcon] = useState<"play" | "pause" | "volume" | "mute" | null>(null)
  const iconTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [hasError, setHasError] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const isStreamtape = src.includes("streamtape.com/")

  useEffect(() => {
    const checkCache = async () => {
      if (isStreamtape || !src || !videoRef.current) return
      try {
        const cache = await caches.open("video-downloads-v1")
        const cachedResponse = await cache.match(src)
        if (cachedResponse) {
          const blob = await cachedResponse.blob()
          const objectUrl = URL.createObjectURL(blob)
          if (videoRef.current) videoRef.current.src = objectUrl
          return () => URL.revokeObjectURL(objectUrl)
        }
      } catch (e) { console.error("Cache check failed in Shorts:", e) }
    }
    checkCache()
  }, [src, isStreamtape])

  useEffect(() => {
    if (isStreamtape || !src || !videoRef.current) return
    if (!isActive && !isNext) {
      if (videoRef.current.src) { videoRef.current.src = ""; videoRef.current.load() }
      return
    }
    const video = videoRef.current
    if (video.src.startsWith("blob:")) return

    const isHLS = src.includes(".m3u8")
    if (isHLS) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true, backBufferLength: 30, maxBufferLength: 10, maxMaxBufferLength: 20, autoStartLoad: isActive })
        hls.loadSource(src); hls.attachMedia(video)
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
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) { video.src = src }
    } else { video.src = src }
  }, [src, isStreamtape, isActive, isNext, retryCount])

  useEffect(() => {
    if (isStreamtape) return
    const video = videoRef.current
    if (!video) return
    if (isActive) {
      setHasError(false)
      video.muted = isMuted
      video.play().catch(() => { video.muted = true; setIsMuted(true); setNeedsInteraction(true); video.play().catch(() => { }) })
    } else { video.pause(); video.currentTime = 0 }
  }, [isActive, isStreamtape, isMuted, needsInteraction, retryCount])

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) { video.play().then(() => { setIsPaused(false); triggerIcon("play") }).catch(() => { }) }
    else { video.pause(); setIsPaused(true); triggerIcon("pause") }
  }

  const triggerIcon = (type: "play" | "pause") => {
    setShowIcon(type)
    if (iconTimeoutRef.current) clearTimeout(iconTimeoutRef.current)
    iconTimeoutRef.current = setTimeout(() => setShowIcon(null), 800)
  }

  const handleRetry = () => { setHasError(false); setIsLoading(true); setRetryCount(prev => prev + 1) }

  return (
    <div className="relative h-full w-full group cursor-pointer bg-black overflow-hidden" onClick={handleInteraction}>
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 text-center z-[100] bg-black/80 backdrop-blur-2xl">
          <Zap className="h-12 w-12 text-primary animate-pulse" />
          <div className="space-y-2">
            <h3 className="text-white text-xl font-black italic uppercase">Connection Lost</h3>
            <p className="text-white/40 text-xs font-bold uppercase">We couldn't load this short.</p>
          </div>
          <Button variant="default" className="rounded-full font-black px-10 h-12 bg-primary text-white" onClick={(e) => { e.stopPropagation(); handleRetry() }}>Retry Loading</Button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="h-full w-full object-contain lg:object-cover" poster={poster} loop playsInline autoPlay={isActive} muted={true} preload="metadata" onLoadStart={() => setIsLoading(true)} onCanPlay={() => setIsLoading(false)} onError={() => { if (isActive) setHasError(true) }} />
          {isLoading && isActive && <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-40 gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black text-white/40 uppercase tracking-widest animate-pulse">Buffering</p></div>}
          <div className="absolute inset-0 z-10" onClick={handleInteraction} />
        </>
      )}
      {showIcon && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 backdrop-blur-3xl p-10 rounded-full animate-out fade-out zoom-out duration-1000 pointer-events-none z-50 shadow-2xl border border-white/10">{showIcon === "play" ? <Play className="h-16 w-16 text-white fill-current" /> : <Pause className="h-16 w-16 text-white fill-current" />}</div>}
      {needsInteraction && isActive && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md animate-in fade-in duration-500">
          <Button variant="default" className="rounded-full font-black h-20 px-10 animate-bounce bg-primary text-white uppercase italic tracking-widest" onClick={(e) => { e.stopPropagation(); const video = videoRef.current; if (video) { video.muted = false; setIsMuted(false); setNeedsInteraction(false); video.play().catch(() => { }) } }}>
            <Play className="h-8 w-8 mr-4 fill-current" />Unmute & Enjoy
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
