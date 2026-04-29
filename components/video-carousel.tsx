"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

interface VideoCarouselProps {
  videos: Video[]
  loading?: boolean
  emptyMessage?: string
}

export function VideoCarousel({ videos, loading, emptyMessage = "No videos found" }: VideoCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setShowLeft(scrollLeft > 20)
      setShowRight(scrollLeft < scrollWidth - clientWidth - 20)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [videos, loading])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current
      const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-hidden py-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="min-w-[180px] sm:min-w-[240px] md:min-w-[280px] flex flex-col gap-2">
            <Skeleton className="aspect-video w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center grayscale opacity-50">
        <p className="text-sm font-medium tracking-widest uppercase text-white/40">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="group relative w-full">
      {/* Navigation Arrows */}
      {showLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -left-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-white/10 glass-heavy text-white opacity-0 shadow-2xl transition-all group-hover:left-2 group-hover:opacity-100"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {showRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-4 top-1/2 z-20 h-10 w-10 -translate-y-1/2 rounded-full border border-white/10 glass-heavy text-white opacity-0 shadow-2xl transition-all group-hover:right-2 group-hover:opacity-100"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="carousel-scrollbar flex gap-4 overflow-x-auto overflow-y-hidden pb-6 pt-2 scroll-smooth px-1"
        style={{ scrollSnapType: "x proximity" }}
      >
        {videos.map((video) => (
          <div 
            key={video._id || video.id} 
            className="w-[180px] sm:w-[240px] md:w-[280px] flex-shrink-0 transition-transform duration-500 hover:scale-[1.02]"
            style={{ scrollSnapAlign: "start" }}
          >
            <VideoCard video={video} index={videos.indexOf(video)} />
          </div>
        ))}
      </div>
    </div>
  )
}
