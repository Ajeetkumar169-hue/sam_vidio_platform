"use client"

import { useEffect, useState } from "react"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp } from "lucide-react"

export default function TrendingPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchVideos = async (isInitial = false) => {
    if (loadingMore || (!hasMore && !isInitial)) return
    
    if (isInitial) setLoading(true)
    else setLoadingMore(true)

    try {
      const url = new URL("/api/videos", window.location.origin)
      url.searchParams.set("sort", "trending")
      url.searchParams.set("limit", "15")
      if (cursor && !isInitial) {
        url.searchParams.set("lastId", cursor.lastId)
        url.searchParams.set("lastCreatedAt", cursor.lastCreatedAt)
      }

      const res = await fetch(url.toString())
      const data = await res.json()
      
      if (data.videos) {
        setVideos(prev => isInitial ? data.videos : [...prev, ...data.videos])
        setCursor(data.nextCursor)
        setHasMore(!!data.nextCursor)
      }
    } catch (error) {
      console.error("Fetch trending error:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchVideos(true)
  }, [])

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 py-6">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Trending</h1>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <SkeletonLoader key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <TrendingUp className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No trending videos yet</h2>
            <p className="text-muted-foreground max-w-sm">Videos will appear here as they gain engagement across the platform.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {videos.map((video, index) => (
              <VideoCard key={video._id || video.id} video={video} index={index} />
            ))}
            {loadingMore && Array.from({ length: 5 }).map((_, i) => (
              <SkeletonLoader key={`more-${i}`} />
            ))}
          </div>
          
          {hasMore && !loadingMore && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={() => fetchVideos()}
                className="rounded-full bg-secondary hover:bg-secondary/80 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
              >
                Load More Trending
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SkeletonLoader() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-9 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}
