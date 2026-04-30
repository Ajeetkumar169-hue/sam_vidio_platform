"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Users, Tv2, Search, ExternalLink } from "lucide-react"
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
    subscriberCount: number
    videoCount: number
  }
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {subscriptions.map((sub) => (
          <div key={sub._id} className="group relative flex flex-col bg-card/40 border border-white/5 rounded-2xl overflow-hidden hover:bg-card/60 transition-all duration-500 hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 luxury-easing">
             {/* Channel Banner/Placeholder */}
             <div className="h-16 w-full bg-gradient-to-br from-primary/20 to-secondary/10 overflow-hidden">
                {sub.channel.banner && (
                    <img src={sub.channel.banner} alt="" className="w-full h-full object-cover opacity-50 transition-transform duration-700 group-hover:scale-110" />
                )}
             </div>

             <div className="px-4 pb-4 flex flex-col items-center -mt-7">
                <div className="h-14 w-14 rounded-full border-[3px] border-background bg-background p-0.5 mb-3 shadow-xl">
                    {sub.channel.logo ? (
                        <img src={sub.channel.logo} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                        <div className="h-full w-full rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                            {sub.channel.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="text-center mb-4">
                    <h3 className="text-sm font-bold truncate max-w-[120px] sm:max-w-[140px] mb-0.5">{sub.channel.name}</h3>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-40 truncate max-w-[120px]">@{sub.channel.slug}</p>
                </div>

                <div className="flex items-center justify-around w-full mb-4 py-2 border-y border-white/5">
                    <div className="text-center">
                        <p className="text-xs font-black text-foreground">{sub.channel.subscriberCount?.toLocaleString() || 0}</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Subs</p>
                    </div>
                    <div className="h-4 w-px bg-white/5" />
                    <div className="text-center">
                        <p className="text-xs font-black text-foreground">{sub.channel.videoCount?.toLocaleString() || 0}</p>
                        <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Videos</p>
                    </div>
                </div>

                <Link href={`/channel/${sub.channel.slug}`} className="w-full">
                    <Button variant="outline" className="w-full h-8 text-xs rounded-lg glass-light border-white/10 hover:bg-white/5 gap-2 group/btn">
                        <ExternalLink className="h-3 w-3 transition-transform group-hover/btn:scale-110" />
                        Visit
                    </Button>
                </Link>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}
