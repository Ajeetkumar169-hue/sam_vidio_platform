"use client"

import { useEffect, useState } from "react"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { ThumbsUp } from "lucide-react"

export default function TopRatedPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/videos?sort=top-rated&limit=40")
      .then((r) => r.json())
      .then((d) => setVideos(d.videos || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 py-6">
      <div className="mb-6 flex items-center gap-3">
        <ThumbsUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Top Rated</h1>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <p className="text-center text-muted-foreground">No top rated videos yet. Like videos to help them get recognized!</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((video) => (
            <VideoCard key={video._id || video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  )
}
