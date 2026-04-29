"use client"

import { useEffect, useState, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Users, Tv2, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface VideoData {
  _id: string
  title: string
  thumbnailUrl: string
  videoUrl: string
  views: number
  createdAt: string
  duration: number
  channel: {
    name: string
    slug: string
    logo?: string
  }
}

export default function SubscriptionFeedPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoData[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<any>(null)
  const [fetchingMore, setFetchingMore] = useState(false)

  const fetchVideos = useCallback(async (cursor?: any) => {
    if (!user) return
    
    const url = new URL("/api/subscriptions/videos", window.location.origin)
    if (cursor) {
      url.searchParams.set("lastId", cursor.lastId)
      url.searchParams.set("lastCreatedAt", cursor.lastCreatedAt)
    }

    try {
      const res = await fetch(url.toString())
      const data = await res.json()
      
      if (data.success) {
        if (cursor) {
          setVideos(prev => [...prev, ...data.videos])
        } else {
          setVideos(data.videos)
        }
        setNextCursor(data.nextCursor)
      }
    } catch (err) {
      toast.error("Failed to load subscription feed")
    } finally {
      setLoading(false)
      setFetchingMore(false)
    }
  }, [user])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleLoadMore = () => {
    if (nextCursor && !fetchingMore) {
      setFetchingMore(true)
      fetchVideos(nextCursor)
    }
  }

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Subscriptions Feed</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center px-4">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Sign in to see your feed</h1>
        <p className="text-muted-foreground max-w-sm">
          Keep up with the latest videos from the creators you love.
        </p>
        <Link href="/login">
          <Button size="lg" className="rounded-full px-8">Sign In</Button>
        </Link>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center px-4">
        <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center">
          <Tv2 className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">Your feed is empty</h1>
            <p className="text-muted-foreground max-w-sm mx-auto">
                Subscribe to channels to see their latest videos appear here.
            </p>
        </div>
        <Link href="/">
          <Button variant="default" className="rounded-full px-8 shadow-lg shadow-primary/20">
            Explore Trending
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 luxury-easing">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Feed</h1>
            <p className="text-muted-foreground text-sm">Latest content from channels you follow</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
        {videos.map((video, index) => (
          <VideoCard key={video._id} video={video as any} index={index} />
        ))}
      </div>

      {nextCursor && (
        <div className="mt-16 flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={fetchingMore}
            variant="outline"
            className="rounded-full px-12 h-12 glass-light border-white/10 hover:bg-white/5 font-bold"
          >
            {fetchingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More Videos"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
