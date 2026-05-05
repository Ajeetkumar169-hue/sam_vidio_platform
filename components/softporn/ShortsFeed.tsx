"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, ThumbsUp, MessageSquare, Share2, Music2, UserPlus, Zap, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/video-player"
import { cn } from "@/lib/utils"

interface Short {
  _id: string
  title: string
  description: string
  videoUrl: string
  likes: number
  channel: {
    name: string
    slug: string
    logo?: string
  }
}

export function ShortsFeed() {
  const [shorts, setShorts] = useState<Short[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/videos?isShort=true&limit=10")
      .then(res => res.json())
      .then(data => {
        setShorts(data.data.videos)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight)
      setCurrentIndex(index)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (shorts.length === 0) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center gap-4">
        <div className="h-20 w-20 bg-secondary rounded-full flex items-center justify-center">
            <Zap className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-xl font-bold">No SoftPorn Shorts found</p>
        <p className="text-muted-foreground">Be the first to upload one!</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-[calc(100vh-64px)] w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
    >
      {shorts.map((short, index) => (
        <div 
          key={short._id} 
          className="h-full w-full snap-start relative flex items-center justify-center"
        >
          {/* Vertical Video Container */}
          <div className="h-full aspect-[9/16] relative bg-zinc-900 shadow-2xl">
            {index === currentIndex && (
                <video 
                    src={short.videoUrl} 
                    className="h-full w-full object-cover"
                    autoPlay
                    loop
                    muted={false}
                    playsInline
                />
            )}

            {/* UI Overlay */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
              
              <div className="flex justify-between items-end gap-4">
                {/* Info (Bottom Left) */}
                <div className="flex-1 pb-4">
                   <div className="flex items-center gap-2 mb-3">
                      <div className="h-9 w-9 rounded-full bg-primary overflow-hidden border border-white/20">
                        {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-sm bg-zinc-800">{short.channel.name[0]}</div>}
                      </div>
                      <p className="font-bold text-white text-sm">@{short.channel.slug}</p>
                      <Button size="sm" className="h-8 rounded-full bg-white text-black hover:bg-white/90 font-bold px-4 ml-2">Subscribe</Button>
                   </div>
                   <div className="space-y-2">
                      <h3 className="font-medium text-white text-base leading-snug line-clamp-2 max-w-[80%]">{short.title}</h3>
                   </div>
                </div>

                {/* Actions Sidebar (Right) */}
                <div className="flex flex-col gap-5 items-center mb-4">
                    {/* Like */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                            <ThumbsUp className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">{short.likes > 0 ? formatNumber(short.likes) : "Like"}</span>
                    </div>

                    {/* Dislike */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                            <ThumbsUp className="h-6 w-6 text-white rotate-180" />
                        </button>
                        <span className="text-xs font-bold text-white">Dislike</span>
                    </div>

                    {/* Comments */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                            <MessageSquare className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">195</span>
                    </div>

                    {/* Share */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Share2 className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">Share</span>
                    </div>

                    {/* Loop/Remix */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                            <RotateCcw className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">3</span>
                    </div>

                    {/* Channel Profile Icon */}
                    <div className="mt-2 h-10 w-10 rounded-lg border-2 border-white/20 overflow-hidden shadow-lg">
                        {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-primary flex items-center justify-center text-xs font-black">SAM</div>}
                    </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

