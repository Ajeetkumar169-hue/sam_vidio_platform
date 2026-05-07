"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Users, Tv2, Search, ExternalLink, Bell, ChevronDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface Subscription {
  _id: string
  channel: {
    _id: string
    name: string
    slug: string
    logo: string
    banner: string
    description: string
    subscriberCount: number
    videoCount: number
  }
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export default function SubscriptionsPage() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetch("/api/subscriptions/list")
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) {
            if (res.status === 401) {
              toast.error("Session expired")
              // Optionally trigger logout or refresh here
              return
            }
            throw new Error(data.error || "Failed to load")
          }
          setSubscriptions(data.subscriptions)
        })
        .catch((err) => {
          console.error("Subs load error:", err)
          toast.error("Failed to load subscriptions")
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Subscriptions</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center px-4">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Sign in to view subscriptions</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Subscribe to your favorite channels to stay updated with their latest content and never miss a release.
          </p>
        </div>
        <Link href="/login">
          <Button size="lg" className="rounded-full px-8 h-12 text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20">
            Sign In Now
          </Button>
        </Link>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center px-4">
        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center">
          <Tv2 className="h-10 w-10 text-white/20" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white/40">No Subscriptions Yet</h1>
          <p className="text-white/20 max-w-sm mx-auto">
            You haven't subscribed to any channels yet. Start exploring and follow creators you like!
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="rounded-full px-8 h-12 glass-light border-white/10 text-white/50 hover:text-white">
            Explore Channels
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-10 luxury-easing">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Subscriptions</h1>
            <p className="text-muted-foreground text-sm">Managing {subscriptions.length} followings</p>
          </div>
        </div>
        
        <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input 
                type="text" 
                placeholder="Search subbed channels..." 
                className="w-full pl-10 pr-4 h-11 rounded-xl glass-light border-white/5 text-sm focus:ring-1 ring-primary/30 outline-none transition-all"
            />
        </div>
      </div>

      <div className="space-y-6">
        {subscriptions.map((sub) => (
          <div key={sub._id} className="group flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 rounded-[2.5rem] bg-foreground/[0.02] border border-white/5 hover:bg-foreground/[0.04] transition-all duration-500 luxury-easing">
             {/* Large Avatar */}
             <Link href={`/channel/${sub.channel.slug}`} className="shrink-0">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full border-4 border-background bg-secondary shadow-2xl overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    {sub.channel.logo ? (
                        <img src={sub.channel.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl font-black text-primary/40 bg-primary/5">
                            {sub.channel.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
             </Link>

             {/* Channel Details */}
             <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                    <h3 className="text-xl font-black text-foreground tracking-tight">{sub.channel.name}</h3>
                </div>
                
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">
                    <span>@{sub.channel.slug}</span>
                    <span className="h-1 w-1 rounded-full bg-foreground/20" />
                    <span>{formatNumber(sub.channel.subscriberCount || 0)} subscribers</span>
                </div>

                {sub.channel.description && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 max-w-2xl mb-4 leading-relaxed">
                        {sub.channel.description}
                    </p>
                )}

                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/20">
                    <span className="flex items-center gap-2">
                        <Tv2 className="h-3 w-3 text-primary" />
                        {sub.channel.videoCount || 0} Videos
                    </span>
                </div>
             </div>

             {/* Action Button (Subscribed) */}
             <div className="shrink-0 self-center">
                <Button 
                    variant="outline" 
                    className="h-12 px-6 rounded-full border-white/10 bg-white/5 hover:bg-white/10 gap-3 group/btn transition-all"
                >
                    <Bell className="h-4 w-4 text-primary group-hover/btn:animate-bounce" />
                    <span className="font-bold uppercase tracking-widest text-xs">Subscribed</span>
                    <ChevronDown className="h-4 w-4 opacity-40" />
                </Button>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
