"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function CategoryPage() {
  const params = useParams()
  const slug = params.slug as string
  const [videos, setVideos] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // First get category info
        const catRes = await fetch("/api/categories")
        const catData = await catRes.json()
        const cat = (catData.categories || []).find((c: any) => c.slug === slug)
        if (cat) {
          setCategoryName(cat.name)
          const vidRes = await fetch(`/api/videos?category=${cat._id || cat.id}&limit=40`)
          const vidData = await vidRes.json()
          setVideos(vidData.videos || [])
        }
      } catch {
        // handle error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {categoryName || slug}
      </h1>
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
        <p className="text-center text-muted-foreground">No videos in this category yet.</p>
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
