"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Users, Tv2, Search, Bell, ChevronDown, UserMinus, Loader2, MoreVertical } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Subscription {
  _id: string
  channel: {
    _id: string
    name: string
    slug: string
    logo: string
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
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user) {
      fetch("/api/subscriptions/list")
        .then(async (res) => {
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || "Failed to load")
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

  const handleUnsubscribe = async (channelSlug: string) => {
    // Optimistic Update
    const prevSubs = [...subscriptions]
    setSubscriptions(prev => prev.filter(sub => sub.channel.slug !== channelSlug))
    
    try {
      const res = await fetch(`/api/channels/${channelSlug}/subscribe`, { method: "POST" })
      const data = await res.json()
      if (data.success && !data.subscribed) {
        toast.success("Unsubscribed successfully")
      } else {
        // If somehow still subscribed, revert
        setSubscriptions(prevSubs)
      }
    } catch {
      toast.error("Failed to unsubscribe")
      setSubscriptions(prevSubs)
    }
  }

  const filteredSubs = subscriptions.filter(sub => 
    sub.channel.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    sub.channel.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[70vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Login to see subscriptions</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Stay connected with your favorite creators.
          </p>
        </div>
        <Link href="/login">
          <Button className="rounded-full px-10 h-11 font-bold">Sign In</Button>
        </Link>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 min-h-[70vh] text-center px-4">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
          <Tv2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">No subscriptions yet</h1>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Explore channels and follow the ones you love.
          </p>
        </div>
        <Link href="/">
          <Button variant="outline" className="rounded-full px-10 h-11">Explore</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 luxury-easing">
      {/* Header & Search */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight">Subscriptions</h1>
            <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full uppercase tracking-widest">
                {subscriptions.length} Channels
            </span>
        </div>
        
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input 
                type="text" 
                placeholder="Search your subscriptions..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 h-12 rounded-2xl bg-secondary/50 border-none outline-none text-sm focus:ring-1 ring-primary/20 transition-all"
            />
        </div>
      </div>

      {/* Subscription List (Matches User Image) */}
      <div className="space-y-1">
        {filteredSubs.length === 0 ? (
            <p className="text-center py-20 text-muted-foreground text-sm font-medium">No channels match your search.</p>
        ) : filteredSubs.map((sub) => (
          <div key={sub._id} className="group flex items-center gap-4 p-3 rounded-2xl hover:bg-secondary/30 transition-all duration-300">
             {/* Channel Avatar */}
             <Link href={`/channel/${sub.channel.slug}`} className="shrink-0">
                <div className="h-14 w-14 rounded-full border border-border overflow-hidden transition-transform group-hover:scale-105">
                    {sub.channel.logo ? (
                        <img src={sub.channel.logo} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl font-black bg-primary/10 text-primary">
                            {sub.channel.name.charAt(0)}
                        </div>
                    )}
                </div>
             </Link>

             {/* Info */}
             <div className="flex-1 min-w-0">
                <Link href={`/channel/${sub.channel.slug}`} className="block group/link">
                    <h3 className="text-sm font-bold truncate group-hover/link:text-primary transition-colors">
                        {sub.channel.name}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium truncate">
                        @{sub.channel.slug} • {formatNumber(sub.channel.subscriberCount || 0)} subscribers
                    </p>
                </Link>
             </div>

             {/* Action Button with Dropdown */}
             <div className="shrink-0 flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="secondary" 
                            className="h-9 px-5 rounded-full text-xs font-bold gap-2 bg-secondary/80 hover:bg-secondary"
                        >
                            <span>Subscribed</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 border-border">
                        <DropdownMenuItem 
                            onClick={() => handleUnsubscribe(sub.channel.slug)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg cursor-pointer"
                        >
                            <UserMinus className="h-4 w-4 mr-2" />
                            <span className="font-bold text-xs uppercase tracking-widest">Unsubscribe</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        ))}
      </div>
    </div>
  )
}

