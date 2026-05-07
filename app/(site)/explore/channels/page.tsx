"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, ArrowLeft, Filter, CheckCircle2, MoreVertical, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SubscribeButton } from "@/components/subscribe-button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface Channel {
  _id: string
  name: string
  slug: string
  logo?: string
  subscriberCount: number
  videoCount?: number
  isVerified?: boolean
}

export default function ExploreChannelsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("Explore")
  const [searchQuery, setSearchQuery] = useState("")

  const tabs = ["Explore", "Most active", "Popular", "New"]

  const fetchChannels = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/channels?limit=50`)
      const data = await res.json()
      setChannels(data.channels || [])
    } catch (err) {
      console.error("Failed to load channels:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const filteredChannels = channels.filter(ch => 
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatSubscribers = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-foreground/5">
        <div className="flex items-center gap-4 px-4 h-16 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-lg font-black tracking-tight">Explore channels</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Filter className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Search Bar - Full width below header */}
        <div className="px-4 py-4">
            <div className="relative group">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                    placeholder="Search channels..." 
                    className="w-full pl-12 h-12 rounded-2xl bg-foreground/5 border-none focus-visible:ring-primary/20 focus-visible:bg-foreground/10 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* Tabs */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-black transition-all whitespace-nowrap",
                  activeTab === tab 
                    ? "bg-primary/20 text-primary border border-primary/20" 
                    : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Channels List */}
        <div className="px-4 pb-20 space-y-2">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <Skeleton className="h-16 w-16 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-9 w-20 rounded-full" />
              </div>
            ))
          ) : (
            filteredChannels.map((channel) => (
              <div 
                key={channel._id} 
                className="flex items-center gap-4 p-3 hover:bg-foreground/5 rounded-2xl transition-colors cursor-pointer group"
                onClick={() => router.push(`/channel/${channel.slug}`)}
              >
                <div className="h-16 w-16 rounded-full bg-foreground/10 shrink-0 overflow-hidden relative">
                  {channel.logo ? (
                    <img src={channel.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/20 text-primary font-black text-xl">
                      {channel.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-black text-base truncate">{channel.name}</h3>
                    {channel.isVerified && <CheckCircle2 className="h-4 w-4 fill-primary text-background" />}
                  </div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                    {formatSubscribers(channel.subscriberCount)} followers
                  </p>
                </div>

                <div onClick={(e) => e.stopPropagation()}>
                    <SubscribeButton 
                        channelSlug={channel.slug} 
                        showCount={false}
                        className="rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black px-6"
                    />
                </div>
              </div>
            ))
          )}

          {!loading && filteredChannels.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-muted-foreground font-bold italic">No channels found matching your search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
