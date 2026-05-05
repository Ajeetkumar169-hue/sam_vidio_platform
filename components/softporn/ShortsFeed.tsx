"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, ThumbsUp, MessageSquare, Share2, Music2, UserPlus, Zap } from "lucide-react"
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
            <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/80 via-transparent to-transparent">
              
              <div className="flex justify-between items-end">
                {/* Info (Left) */}
                <div className="flex-1 space-y-4 pr-12">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary overflow-hidden border-2 border-primary">
                        {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold">{short.channel.name[0]}</div>}
                      </div>
                      <p className="font-bold text-white tracking-tight">@{short.channel.slug}</p>
                      <Button size="sm" className="h-8 rounded-full bg-white text-black hover:bg-white/90 font-bold px-4">Follow</Button>
                   </div>
                   <div className="space-y-1">
                      <h3 className="font-bold text-lg text-white line-clamp-2">{short.title}</h3>
                      <p className="text-sm text-white/70 line-clamp-1">{short.description}</p>
                   </div>
                   <div className="flex items-center gap-2 text-xs font-medium text-white/50">
                      <Music2 className="h-3 w-3" />
                      <span>Original Sound - @{short.channel.slug}</span>
                   </div>
                </div>

                {/* Actions (Right) */}
                <div className="flex flex-col gap-6 items-center">
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                            <ThumbsUp className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">{short.likes}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                            <MessageSquare className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">42</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <button className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Share2 className="h-6 w-6 text-white" />
                        </button>
                        <span className="text-xs font-bold text-white">Share</span>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-purple-500 p-0.5 mt-2 animate-spin-slow">
                        <div className="h-full w-full rounded-[10px] bg-black flex items-center justify-center">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
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
