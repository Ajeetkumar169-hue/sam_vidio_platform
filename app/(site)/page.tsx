"use client"

import { useEffect, useState } from "react"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

interface Video {
  _id: string
  title: string
  thumbnailUrl: string
  views: number
  likes: number
  duration: number | string
  createdAt: string
  channel?: { name: string; slug: string; logo?: string }
  uploader?: { username: string; avatar?: string }
  videoUrl: string
}

export default function HomePage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchVideos = async (pageNum: number, append = false) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const res = await fetch(`/api/videos?page=${pageNum}&limit=12`)
      const data = await res.json()
      const newVideos = data.data?.videos || data.videos || []

      if (newVideos.length < 12) setHasMore(false)
      
      if (append) {
        setVideos(prev => [...prev, ...newVideos])
      } else {
        setVideos(newVideos)
      }
    } catch (err) {
      console.error("Failed to load videos:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    fetchVideos(1)
  }, [])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchVideos(nextPage, true)
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6">
      
      {/* YouTube Style Categories Bar (Optional but nice) */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-6 sticky top-16 bg-background z-10">
        {["All", "New to you", "Recently uploaded", "Trending", "Popular"].map((cat) => (
            <button 
                key={cat} 
                className="px-4 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 text-sm font-black whitespace-nowrap transition-colors"
            >
                {cat}
            </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
           {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="space-y-3">
               <Skeleton className="aspect-video w-full rounded-2xl" />
               <div className="flex gap-3">
                 <Skeleton className="h-10 w-10 rounded-full" />
                 <div className="flex-1 space-y-2">
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-3 w-2/3" />
                 </div>
               </div>
             </div>
           ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>

          {videos.length === 0 && (
            <div className="py-20 text-center">
              <h2 className="text-xl font-bold">No videos found</h2>
              <p className="text-muted-foreground mt-2">Try checking back later or explore channels.</p>
            </div>
          )}

          {hasMore && (
            <div className="mt-12 flex justify-center pb-10">
              <Button 
                variant="outline" 
                onClick={loadMore} 
                disabled={loadingMore}
                className="rounded-full px-8 font-black uppercase tracking-widest text-xs"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
