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
import { ThumbsUp, Eye, Users, Clock, Tag, Trash2 } from "lucide-react"
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

  useEffect(() => {
    async function loadRelated() {
      if (initialVideo.category?._id) {
        try {
          const relRes = await fetch(`/api/videos?category=${initialVideo.category._id}&limit=8`)
          const relData = await relRes.json()
          setRelated((relData.videos || []).filter((v: VideoData) => v._id !== videoId))
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
    <div className="pb-4 lg:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        {/* Main Content */}
        <div className="flex-1">
          {/* Video Player */}
          <div className="aspect-video w-full overflow-hidden bg-black sm:rounded-lg">
            <VideoPlayer 
              url={video.videoUrl} 
              poster={video.thumbnailUrl} 
            />
          </div>

          {/* Video Info Container */}
          <div className="mt-4 px-4 sm:px-0">
            <h1 className="text-xl font-bold leading-snug text-foreground md:text-2xl">
              {video.title}
            </h1>

            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {formatNumber(video.views)} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDate(video.createdAt)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <div className="flex items-center rounded-full bg-secondary p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-l-full pr-4 border-r border-white/10 hover:bg-white/5",
                      liked && "text-primary"
                    )}
                    onClick={handleLike}
                  >
                    <ThumbsUp className={cn("h-4 w-4", liked && "fill-current")} />
                    <span className="text-xs font-bold">{formatNumber(likeCount)}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "gap-2 rounded-r-full pl-4 hover:bg-white/5",
                      disliked && "text-destructive"
                    )}
                    onClick={handleDislike}
                  >
                    <ThumbsUp className={cn("h-4 w-4 rotate-180", disliked && "fill-current")} />
                    <span className="text-xs font-bold">-{formatNumber(dislikeCount)}</span>
                  </Button>
                </div>
                
                {/* Modern Share Trigger */}
                <ShareDialog videoId={videoId} title={video.title} description={video.description} />
                
                <DownloadButton video={video} />
                
                {user?.role === "admin" && (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="gap-2 w-full sm:w-auto" 
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {/* Channel Info */}
            {video.channel && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between justify-center rounded-lg bg-secondary p-3">
                <Link
                  href={`/channel/${video.channel.slug}`}
                  className="flex items-center gap-3 mb-3 sm:mb-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {video.channel.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{video.channel.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {formatNumber(video.channel.subscriberCount || 0)} subscribers
                    </p>
                  </div>
                </Link>
                <SubscribeButton 
                  channelSlug={video.channel.slug} 
                  initialSubscriberCount={video.channel.subscriberCount}
                  className="w-full sm:w-auto"
                />
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="mt-4 rounded-lg bg-secondary p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground md:text-base">
                  {video.description}
                </p>
              </div>
            )}

            {/* Tags */}
            {video.tags && video.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="mt-6">
              <CommentsSection videoId={videoId} />
            </div>
          </div>
        </div>

        {/* Related Videos Sidebar */}
        <div className="px-4 sm:px-0 lg:px-0">
          <aside className="w-full lg:w-80 xl:w-96">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Related Videos</h3>
            <div className="flex flex-col gap-3">
              {related.length > 0 ? (
                related.map((v) => <VideoCard key={v._id} video={v} compact />)
              ) : (
                <p className="text-sm text-muted-foreground">No related videos found</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
