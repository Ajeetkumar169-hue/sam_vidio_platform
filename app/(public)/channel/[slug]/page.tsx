"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { VideoCard } from "@/components/video-card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Users, Film, Calendar, Camera } from "lucide-react"
import { BrandUpload } from "@/components/brand-upload"

interface ChannelData {
  _id?: string
  id?: string
  name: string
  slug: string
  description: string
  logo: string
  banner: string
  subscriberCount: number
  videoCount: number
  createdAt: string
  owner?: { _id?: string; id?: string; username: string; avatar: string }
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export default function ChannelPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const slug = params.slug as string

  const [channel, setChannel] = useState<ChannelData | null>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribed, setSubscribed] = useState(false)
  const [subCount, setSubCount] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/channels/${slug}`)
        const data = await res.json()
        if (data.channel) {
          setChannel(data.channel)
          setVideos(data.videos || [])
          setSubCount(data.channel.subscriberCount || 0)
        }
      } catch {
        // error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  useEffect(() => {
    if (user && slug) {
      fetch(`/api/channels/${slug}/subscribe`)
        .then((r) => r.json())
        .then((d) => setSubscribed(d.subscribed))
        .catch(() => { })
    }
  }, [user, slug])

  const handleSubscribe = useCallback(async () => {
    if (!user) {
      router.push("/login")
      return
    }
    try {
      const res = await fetch(`/api/channels/${slug}/subscribe`, { method: "POST" })
      const data = await res.json()
      
      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Session expired. Please sign in again.")
          router.push("/login")
          return
        }
        throw new Error(data.error || "Failed to subscribe")
      }

      setSubscribed(data.subscribed)
      setSubCount((c) => (data.subscribed ? c + 1 : Math.max(0, c - 1)))
      toast.success(data.subscribed ? "Subscribed!" : "Unsubscribed")
    } catch (error: any) {
      toast.error(error.message || "Failed to subscribe")
    }
  }, [user, slug, router])

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="mt-4 flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-lg text-muted-foreground">Channel not found</p>
      </div>
    )
  }

  const isOwner = user && channel.owner && (user.id === (channel.owner._id || channel.owner.id))

  return (
    <div className="max-w-screen-xl mx-auto pb-8">
      {/* Banner */}
      <div className="relative group/banner h-32 w-full bg-gradient-to-r from-primary/30 via-primary/10 to-secondary lg:h-48 overflow-hidden rounded-b-2xl">
        {channel.banner ? (
          <img src={channel.banner} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover/banner:scale-105" />
        ) : (
          <div className="h-full w-full flex items-center justify-center opacity-20">
             <h2 className="text-4xl font-black uppercase tracking-widest">{channel.name}</h2>
          </div>
        )}
        
        {/* Banner Overlay Name */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 lg:p-6">
           <span className="text-white font-black text-2xl lg:text-4xl uppercase tracking-tighter opacity-80 select-none">
              {channel.name}
           </span>
        </div>

        {isOwner && (
          <div className="absolute top-4 right-4 animate-in fade-in slide-in-from-top-2 duration-500">
            <BrandUpload 
              channelSlug={channel.slug} 
              type="banner" 
              currentValue={channel.banner}
              onUpdate={(url) => setChannel(prev => prev ? { ...prev, banner: url } : null)}
            />
          </div>
        )}
      </div>

      {/* Channel Info */}
      <div className="flex flex-col gap-4 px-2 sm:px-4 md:px-6">
        <div className="-mt-8 lg:-mt-12 flex flex-col sm:flex-row sm:items-end gap-6 relative z-10">
          <div className="relative group/logo">
            <div className="flex h-24 w-24 lg:h-32 lg:w-32 items-center justify-center rounded-full border-4 border-background bg-primary text-3xl font-bold text-primary-foreground shrink-0 overflow-hidden shadow-2xl transition-transform duration-500 group-hover/logo:scale-105">
              {channel.logo ? (
                <img src={channel.logo} alt={channel.name} className="h-full w-full object-cover" />
              ) : (
                channel.name.charAt(0).toUpperCase()
              )}
              
              {/* Logo Overlay Name (Visible on Hover mostly or subtle) */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-white">{channel.name}</span>
              </div>
            </div>

            {isOwner && (
              <div className="absolute -bottom-1 -right-1">
                <BrandUpload 
                  channelSlug={channel.slug} 
                  type="logo" 
                  currentValue={channel.logo}
                  onUpdate={(url) => setChannel(prev => prev ? { ...prev, logo: url } : null)}
                />
              </div>
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground lg:text-3xl tracking-tight">{channel.name}</h1>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground font-medium">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {formatNumber(subCount)} subscribers
              </span>
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                {channel.videoCount} videos
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(channel.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
              </span>
            </div>
          </div>
          {!isOwner && (
            <Button
              variant={subscribed ? "outline" : "default"}
              onClick={handleSubscribe}
              className="w-full sm:w-auto mt-2 sm:mt-0"
            >
              {subscribed ? "Subscribed" : "Subscribe"}
            </Button>
          )}
          {isOwner && (
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full sm:w-auto mt-2 sm:mt-0">
              Manage Channel
            </Button>
          )}
        </div>

        {channel.description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {channel.description}
          </p>
        )}

        {/* Videos */}
        <div className="mt-4">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Videos</h2>
          {videos.length === 0 ? (
            <p className="text-center text-muted-foreground">No videos uploaded yet</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {videos.map((v) => (
                <VideoCard key={v._id || v.id} video={v} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
