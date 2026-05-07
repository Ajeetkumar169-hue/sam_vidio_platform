"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { VideoCard } from "@/components/video-card"
import { CommentsSection } from "@/components/comments-section"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { VideoPlayer } from "@/components/video-player"
import { DownloadButton } from "@/components/download-button"
import { ShareDialog } from "@/components/share-dialog"
import { ThumbsUp, Eye, Users, Clock, Tag, Trash2, Share2, DownloadCloud, Bookmark, MoreVertical, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { SubscribeButton } from "@/components/subscribe-button"

interface VideoData {
  _id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  views: number
  likes: number
  dislikes: number
  duration: number
  tags: string[]
  createdAt: string
  channel?: {
    _id: string
    name: string
    slug: string
    logo?: string
    subscriberCount?: number
  }
  category?: {
    _id: string
    name: string
    slug: string
  }
  uploader?: {
    _id: string
    username: string
    avatar?: string
  }
  qualities?: Array<{ label: string; url: string; size?: number }>
}

function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0"
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

interface WatchViewProps {
  initialVideo: VideoData
}

export function WatchView({ initialVideo }: WatchViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const videoId = initialVideo._id

  const [video, setVideo] = useState<VideoData>(initialVideo)
  const [related, setRelated] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(false) // Initial load done server-side
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [likeCount, setLikeCount] = useState(initialVideo.likes || 0)
  const [dislikeCount, setDislikeCount] = useState(initialVideo.dislikes || 0)
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    async function loadRelated() {
      if (initialVideo.category?._id) {
        try {
          const relRes = await fetch(`/api/videos?category=${initialVideo.category._id}&limit=8`)
          const relData = await relRes.json()
          setRelated((relData.data?.videos || relData.videos || []).filter((v: VideoData) => v._id !== videoId))
        } catch { }
      }
    }
    loadRelated()
  }, [videoId, initialVideo.category?._id])

  // Check like status
  useEffect(() => {
    if (user && videoId) {
      fetch(`/api/videos/${videoId}/like`)
        .then((r) => r.json())
        .then((d) => {
          setLiked(d.liked)
          setDisliked(d.disliked)
        })
        .catch(() => { })
    }
  }, [user, videoId])

  // Record Watch History
  useEffect(() => {
    if (user && videoId) {
      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId })
      }).catch(err => console.error("History recording failed:", err))
    }
  }, [user, videoId])


  const handleLike = useCallback(async () => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" })
      })
      const data = await res.json()
      
      if (data.liked !== undefined) {
        setLiked(data.liked)
        if (data.liked && disliked) {
           setDisliked(false)
           setDislikeCount(prev => Math.max(0, prev - 1))
        }
        setLikeCount(data.likes)
        setDislikeCount(data.dislikes)
      }
    } catch {
      toast.error("Failed to like")
    }
  }, [user, videoId, router, disliked])

  const handleDislike = useCallback(async () => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      const res = await fetch(`/api/videos/${videoId}/like`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "dislike" })
      })
      const data = await res.json()
      
      if (data.disliked !== undefined) {
        setDisliked(data.disliked)
        if (data.disliked && liked) {
           setLiked(false)
           setLikeCount(prev => Math.max(0, prev - 1))
        }
        setDislikeCount(data.dislikes)
        setLikeCount(data.likes)
      }
    } catch {
      toast.error("Failed to dislike")
    }
  }, [user, videoId, router, liked])


  const handleDelete = async () => {
    if (!video) return
    if (!confirm("Are you sure you want to delete this video? This action cannot be undone.")) return

    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete video")
      
      toast.success("Video deleted successfully")
      router.push("/dashboard")
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete video")
    }
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-[1700px] lg:px-6 lg:py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          
          {/* LEFT COLUMN: Player & Info */}
          <div className="flex-1 lg:max-w-[calc(100%-400px)] xl:max-w-[calc(100%-450px)]">
            
            {/* 1. Video Player */}
            <div className="aspect-video w-full overflow-hidden bg-black lg:rounded-2xl shadow-2xl">
              <VideoPlayer 
                url={video.videoUrl} 
                poster={video.thumbnailUrl} 
                qualities={video.qualities}
              />
            </div>

            {/* 2. Video Title & Metadata */}
            <div className="mt-4 px-4 lg:px-0">
              <h1 className="text-xl font-black leading-tight text-foreground md:text-2xl lg:text-3xl tracking-tight">
                {video.title}
              </h1>
              
              {/* Mobile Meta (One line) */}
              <div className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground/60 mt-2 lg:hidden font-medium">
                {video.channel && <span>@{video.channel.slug}</span>}
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span>{formatNumber(video.views)} views</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                <span>{formatDate(video.createdAt)}</span>
                <span className="text-primary font-bold ml-1">#Trending</span>
                <span className="ml-1 text-foreground/40">...more</span>
              </div>
            </div>

            {/* 3. Actions Bar (PC vs Mobile handled via flex-col/row) */}
            <div className="mt-4 px-4 lg:px-0 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              
              {/* Channel Section */}
              <div className="flex items-center justify-between lg:justify-start lg:gap-6">
                {video.channel && (
                  <div className="flex items-center gap-3">
                    <Link href={`/channel/${video.channel.slug}`} className="relative h-10 w-10 lg:h-12 lg:w-12 shrink-0">
                      {video.channel.logo ? (
                        <img src={video.channel.logo} alt="" className="h-full w-full rounded-full object-cover border border-foreground/10" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground font-black uppercase lg:text-lg">
                          {video.channel.name.charAt(0)}
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 pr-4">
                      <Link href={`/channel/${video.channel.slug}`} className="block font-black text-sm lg:text-base truncate hover:text-primary transition-colors">
                        {video.channel.name}
                      </Link>
                    </div>
                  </div>
                )}
                <SubscribeButton 
                  channelSlug={video.channel?.slug || ""} 
                  initialSubscriberCount={video.channel?.subscriberCount}
                  showCount={false}
                  className="rounded-full bg-foreground text-background hover:bg-foreground/90 font-black px-6 text-xs lg:text-sm h-10 border-none shadow-none"
                />
              </div>

              {/* Action Buttons (Pill Group) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                {/* Like/Dislike Pill */}
                <div className="flex items-center h-10 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors">
                  <button 
                    onClick={handleLike}
                    className={cn(
                      "flex items-center gap-2 h-full px-4 rounded-l-full border-r border-foreground/5 hover:bg-foreground/5 transition-all",
                      liked && "text-primary"
                    )}
                  >
                    <ThumbsUp className={cn("h-5 w-5", liked && "fill-current")} />
                    <span className="text-sm font-black tracking-tight">{formatNumber(likeCount)}</span>
                  </button>
                  <button 
                    onClick={handleDislike}
                    className={cn(
                      "flex items-center h-full px-3 rounded-r-full hover:bg-foreground/5 transition-all",
                      disliked && "text-destructive"
                    )}
                  >
                    <ThumbsUp className={cn("h-5 w-5 rotate-180", disliked && "fill-current")} />
                  </button>
                </div>

                {/* Share Pill */}
                <ShareDialog 
                  videoId={videoId} 
                  title={video.title} 
                  trigger={
                    <button className="flex items-center gap-2 h-10 px-4 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors whitespace-nowrap">
                      <Share2 className="h-5 w-5" />
                      <span className="text-sm font-black tracking-tight">Share</span>
                    </button>
                  }
                />

                {/* Download Pill */}
                <DownloadButton 
                  video={video} 
                  trigger={
                    <button className="flex items-center gap-2 h-10 px-4 rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors whitespace-nowrap">
                      <DownloadCloud className="h-5 w-5" />
                      <span className="text-sm font-black tracking-tight">Download</span>
                    </button>
                  }
                />

                {/* Save Pill removed per request */}

                {/* More Menu removed per request */}
              </div>
            </div>

            {/* 4. Description Box */}
            <div className="mt-4 px-4 lg:px-0">
              <div 
                className="rounded-2xl bg-foreground/5 p-4 hover:bg-foreground/[0.07] transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => {
                   const p = document.getElementById("video-description")
                   if (p) p.classList.toggle("line-clamp-none")
                }}
              >
                <div className="flex items-center gap-2 text-sm font-black mb-1">
                  <span>{formatNumber(video.views)} views</span>
                  <span>{formatDate(video.createdAt)}</span>
                </div>
                <p 
                    id="video-description" 
                    className="text-sm leading-relaxed whitespace-pre-wrap line-clamp-2 transition-all duration-500"
                >
                  {video.description || "Looking for more details? Click more..."}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {video.tags?.map(tag => (
                    <span key={tag} className="text-primary font-bold text-xs hover:underline">#{tag}</span>
                  ))}
                </div>
                <button className="mt-2 text-xs font-black uppercase tracking-widest text-primary hover:underline">
                    ...more
                </button>
              </div>
            </div>

            {/* 5. Mobile Comments Preview Area */}
            <div className="mt-4 px-4 lg:hidden">
               <div 
                className="rounded-2xl bg-foreground/5 p-4 space-y-3 cursor-pointer hover:bg-foreground/[0.07] transition-all"
                onClick={() => {
                    document.getElementById("full-comments-section")?.scrollIntoView({ behavior: "smooth" })
                }}
               >
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm uppercase tracking-widest">Comments</h3>
                    <div className="flex -space-x-1">
                       <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-foreground/10 shrink-0 overflow-hidden">
                       <img src={user?.avatar || "/default-avatar.png"} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-muted-foreground italic leading-tight">Tap to view comments or write your own...</p>
                    </div>
                  </div>
               </div>
            </div>

            {/* 6. Comments Section (PC) */}
            <div className="mt-8 hidden lg:block">
              <CommentsSection videoId={videoId} />
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar (Related Videos) */}
          <div className="lg:w-[400px] xl:w-[450px] shrink-0">
            <aside className="px-4 lg:px-0 space-y-4">
              
              {/* Category Pills (YouTube Style) */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                <button className="px-4 py-1.5 rounded-full bg-foreground text-background text-sm font-black shrink-0">All</button>
                <button className="px-4 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-sm font-black shrink-0 transition-colors">From {video.channel?.name || "Channel"}</button>
                <button className="px-4 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-sm font-black shrink-0 transition-colors">Related</button>
                <button className="px-4 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-sm font-black shrink-0 transition-colors">Recently uploaded</button>
              </div>

              {/* Related Video List */}
              <div className="flex flex-col gap-4">
                {related.length > 0 ? (
                  related.map((v) => (
                    <VideoCard key={v._id} video={v} compact className="transition-all duration-300" />
                  ))
                ) : (
                   <div className="py-10 text-center rounded-2xl bg-foreground/5">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">No Related Videos</p>
                   </div>
                )}
              </div>

              {/* Mobile Comments Full List (Always at bottom on mobile) */}
              <div id="full-comments-section" className="mt-10 lg:hidden border-t border-foreground/5 pt-6">
                 <CommentsSection videoId={videoId} />
              </div>
            </aside>
          </div>

        </div>
      </div>
    </div>
  )
}
