"use client"

import { useState, useEffect, useRef } from "react"
import { ThumbsUp, MessageSquare, Share2, Loader2, Zap, Tag, Trash2, DownloadCloud } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ShareDialog } from "@/components/share-dialog"
import { DownloadButton } from "@/components/download-button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { CommentsSection } from "@/components/comments-section"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

interface Short {
  _id: string
  title: string
  description: string
  videoUrl: string
  likes: number
  uploader: string
  channel: {
    name: string
    slug: string
    logo?: string
  }
}

export function ShortsFeed() {
  const { user } = useAuth()
  const router = useRouter()
  const [shorts, setShorts] = useState<Short[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedStatus, setLikedStatus] = useState<Record<string, { liked: boolean, disliked: boolean, likes: number }>>({})
  const [commentOpen, setCommentOpen] = useState(false)
  const [commentShortId, setCommentShortId] = useState<string | null>(null)
  const lastScrollTop = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/videos?isShort=true&limit=10")
      .then(res => res.json())
      .then(data => {
        const videos = data.data.videos || []
        setShorts(videos)
        
        // Initialize like status
        const status: Record<string, { liked: boolean, disliked: boolean, likes: number }> = {}
        videos.forEach((v: Short) => {
          status[v._id] = { liked: false, disliked: false, likes: v.likes }
        })
        setLikedStatus(status)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, clientHeight } = containerRef.current
    
    // Toggle Navbars based on scroll direction (Mobile Only)
    // We use a 10px threshold to avoid jitter
    if (window.innerWidth < 1024) {
      if (scrollTop > lastScrollTop.current + 10) {
        window.dispatchEvent(new CustomEvent("toggle-navs", { detail: true }))
      } else if (scrollTop < lastScrollTop.current - 10) {
        window.dispatchEvent(new CustomEvent("toggle-navs", { detail: false }))
      }
    }
    lastScrollTop.current = scrollTop

    const index = Math.round(scrollTop / clientHeight)
    if (index !== currentIndex) {
      setCurrentIndex(index)
    }
  }

  const handleLike = async (videoId: string) => {
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
      setLikedStatus(prev => ({
        ...prev,
        [videoId]: {
          liked: data.liked,
          disliked: data.disliked,
          likes: data.likes
        }
      }))
    } catch {
      toast.error("Failed to like")
    }
  }

  const handleDislike = async (videoId: string) => {
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
      setLikedStatus(prev => ({
        ...prev,
        [videoId]: {
          liked: data.liked,
          disliked: data.disliked,
          likes: data.likes
        }
      }))
    } catch {
      toast.error("Failed to dislike")
    }
  }

  const handleDelete = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to delete this short?")) return
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Short deleted")
      setShorts(prev => prev.filter(s => s._id !== videoId))
    } catch (err: any) {
      toast.error(err.message)
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
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-background"
    >
      {shorts.map((short, index) => (
        <div 
          key={short._id} 
          className="h-full w-full snap-start relative flex items-center justify-center"
        >
          {/* Vertical Video Container */}
          <div className="h-full aspect-[9/16] relative bg-background shadow-2xl">
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
              
              <div className="flex flex-row-reverse justify-between items-end gap-4">
                {/* Info & Right Actions */}
                <div className="flex-1 pb-4 text-right flex flex-col items-end gap-4">
                   <div className="flex items-center justify-end gap-2 mb-1">
                      <Button size="sm" className="h-8 rounded-full bg-white text-black hover:bg-white/90 font-bold px-4 mr-2">Subscribe</Button>
                      <p className="font-bold text-white text-sm">@{short.channel.slug}</p>
                      <div className="h-9 w-9 rounded-full bg-primary overflow-hidden border border-white/20">
                        {short.channel.logo ? <img src={short.channel.logo} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-bold text-sm bg-secondary">{short.channel.name[0]}</div>}
                      </div>
                   </div>
                   
                   <div className="space-y-2 flex flex-col items-end">
                      <h3 className="font-medium text-white text-base leading-snug line-clamp-2 max-w-[80%] mb-2">{short.title}</h3>
                   </div>

                   {/* Right Side Action Icons (Share & Download) */}
                   <div className="flex flex-col gap-3 items-center">
                        {/* Share */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">Share</span>
                            <ShareDialog 
                              videoId={short._id} 
                              title={short.title} 
                              trigger={
                                <button className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
                                    <Share2 className="h-4.5 w-4.5 text-white" />
                                </button>
                              }
                            />
                        </div>

                        {/* Download */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-tighter">Save</span>
                            <DownloadButton 
                              video={short} 
                              trigger={
                                <button className="h-9 w-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all active:scale-90">
                                    <DownloadCloud className="h-4.5 w-4.5 text-white" />
                                </button>
                              }
                            />
                        </div>
                   </div>
                </div>

                {/* Left Actions Sidebar */}
                <div className="flex flex-col gap-5 items-center mb-4 pl-3">
                    {/* Like */}
                    <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => handleLike(short._id)}
                          className={cn(
                            "h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
                            likedStatus[short._id]?.liked ? "bg-primary text-white" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                            <ThumbsUp className={cn("h-5 w-5", likedStatus[short._id]?.liked && "fill-current")} />
                        </button>
                        <span className="text-[10px] font-bold text-white">{formatNumber(likedStatus[short._id]?.likes || short.likes)}</span>
                    </div>

                    {/* Dislike */}
                    <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => handleDislike(short._id)}
                          className={cn(
                            "h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors",
                            likedStatus[short._id]?.disliked ? "bg-destructive text-white" : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                            <ThumbsUp className={cn("h-5 w-5 rotate-180", likedStatus[short._id]?.disliked && "fill-current")} />
                        </button>
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Dislike</span>
                    </div>

                    {/* Delete (Only for Owner/Admin) */}
                    {(user?.id === short.uploader || user?.role === "admin") && (
                      <div className="flex flex-col items-center gap-1">
                          <button 
                            onClick={() => handleDelete(short._id)}
                            className="h-10 w-10 rounded-full bg-destructive/10 backdrop-blur-md flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors"
                          >
                              <Trash2 className="h-5 w-5" />
                          </button>
                          <span className="text-[10px] font-bold text-destructive uppercase tracking-tighter">Delete</span>
                      </div>
                    )}

                    {/* Comments */}
                    <div className="flex flex-col items-center gap-1">
                        <button 
                          onClick={() => {
                            setCommentShortId(short._id)
                            setCommentOpen(true)
                          }}
                          className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <MessageSquare className="h-5 w-5 text-white" />
                        </button>
                        <span className="text-[10px] font-bold text-white">Comments</span>
                    </div>

                    {/* Share */}
                    <div className="flex flex-col items-center gap-1">
                        <ShareDialog 
                          videoId={short._id} 
                          title={short.title} 
                          trigger={
                            <button className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors">
                                <Share2 className="h-5 w-5 text-white" />
                            </button>
                          }
                        />
                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Share</span>
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

      {/* Real-time Comments Drawer */}
      <Drawer open={commentOpen} onOpenChange={setCommentOpen}>
        <DrawerContent className="max-h-[80vh] bg-background border-t border-white/10">
          <DrawerHeader className="border-b border-white/5 pb-2">
            <DrawerTitle>Comments</DrawerTitle>
            <DrawerDescription>View and post comments on this short</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto">
            {commentShortId && (
              <CommentsSection videoId={commentShortId} />
            )}
          </div>
          <DrawerFooter className="pt-0">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
}

