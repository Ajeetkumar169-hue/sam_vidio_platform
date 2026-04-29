"use client"

import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Video {
  _id?: string
  id?: string
  title: string
  thumbnailUrl: string
  views: number
  likes: number
  duration: number | string
  createdAt: string
  channel?: { name: string; slug: string; logo?: string }
  category?: { name: string; slug: string }
}

interface VideoGridProps {
  videos: Video[]
  loading?: boolean
  emptyMessage?: string
}

export function VideoGrid({ videos, loading, emptyMessage = "No videos found" }: VideoGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-video w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {videos.map((video, index) => (
        <VideoCard key={video._id || video.id} video={video} index={index} />
      ))}
    </div>
  )
}
