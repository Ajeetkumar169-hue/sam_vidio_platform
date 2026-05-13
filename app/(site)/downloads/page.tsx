"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Trash2,
  TrendingUp,
  MoreVertical,
  CheckCircle2,
  Download,
  Settings2,
  HardDrive,
  Film,
  Zap,
  ChevronRight,
  Search
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<any[]>([])
  const [mounted, setMounted] = useState(false)
  const [filter, setFilter] = useState<"all" | "videos" | "shorts">("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setMounted(true)
    const history = JSON.parse(localStorage.getItem("download_history") || "[]")
    // Sort by downloadedAt (newest first)
    const sorted = history.sort((a: any, b: any) => b.downloadedAt - a.downloadedAt)
    setDownloads(sorted)
  }, [])

  const filteredDownloads = useMemo(() => {
    return downloads.filter(item => {
      const matchesFilter =
        filter === "all" ? true :
          filter === "videos" ? !item.isShort :
            item.isShort

      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [downloads, filter, searchQuery])

  const storageStats = useMemo(() => {
    // Mock storage calculation (roughly 10MB per minute of video)
    const totalVideos = downloads.length
    const estimatedSizeGB = (totalVideos * 0.15).toFixed(1) // Average 150MB per video
    const percentUsed = Math.min(95, totalVideos * 4) // Mock percentage
    return { estimatedSizeGB, percentUsed }
  }, [downloads])

  const handleClearAll = () => {
    if (confirm("Are you sure you want to clear your download history? This will also remove offline access.")) {
      localStorage.removeItem("download_history")
      // Also clear cache if possible
      if ('caches' in window) {
        caches.delete("video-downloads-v1")
      }
      setDownloads([])
      toast.success("Download history cleared")
    }
  }

  const handleRemoveItem = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const itemToRemove = downloads.find(item => (item.id || item._id) === id)
    const updated = downloads.filter(item => (item.id || item._id) !== id)
    localStorage.setItem("download_history", JSON.stringify(updated))
    setDownloads(updated)

    // Try to remove from cache
    if (itemToRemove?.videoUrl && 'caches' in window) {
      const cache = await caches.open("video-downloads-v1")
      await cache.delete(itemToRemove.videoUrl)
    }

    toast.success("Removed from downloads")
  }

  function formatViews(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  function timeAgo(date: number | string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  }

  if (!mounted) return null

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-12">

        {/* Main Content Area */}
        <div className="space-y-8">
          <header className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-black tracking-tight text-foreground italic uppercase">Downloads</h1>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <Settings2 className="h-5 w-5" />
                </Button>
                {downloads.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearAll}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-full"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search your downloads..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 w-full md:w-auto">
                {(["all", "videos", "shorts"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      filter === t
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "text-white/40 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {filteredDownloads.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                {filteredDownloads.map((video) => (
                  <div key={video.id || video._id} className="group relative flex gap-4 hover:bg-white/5 p-3 rounded-[2rem] transition-all duration-300">
                    <Link
                      href={`/watch/${video.id || video._id}`}
                      className="relative w-44 h-24 md:w-64 md:h-36 shrink-0 overflow-hidden rounded-[1.5rem] bg-secondary"
                    >
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      {video.duration && (
                        <span className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg border border-white/10">
                          {video.duration}
                        </span>
                      )}
                      {video.isShort && (
                        <div className="absolute top-3 left-3 bg-red-600 p-1.5 rounded-lg shadow-xl">
                          <Zap className="h-3 w-3 text-white fill-current" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </Link>

                    <div className="flex-1 min-w-0 py-2">
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <Link href={`/watch/${video.id || video._id}`}>
                            <h2 className="text-base md:text-xl font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors mb-2 pr-10">
                              {video.title}
                            </h2>
                          </Link>
                          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-muted-foreground font-medium">
                            <div className="flex items-center gap-1.5 text-primary">
                              <CheckCircle2 className="h-3.5 w-3.5 fill-current" />
                              <span className="font-bold">Offline Ready</span>
                            </div>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span className="hover:text-foreground transition-colors cursor-pointer">{video.channel?.name || "Premium Channel"}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                            <span>{formatViews(video.views || 0)} views</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">
                          <span>Downloaded {timeAgo(video.downloadedAt || video.createdAt)}</span>
                          <span>•</span>
                          <span>High Quality 1080p</span>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-10 w-10">
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 glass-heavy border-white/10 rounded-2xl p-1.5 shadow-2xl">
                          <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer">
                            <Film className="h-4 w-4" />
                            <span className="font-bold text-sm">View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-3 rounded-xl cursor-pointer">
                            <Download className="h-4 w-4" />
                            <span className="font-bold text-sm">Save to Device</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-3 py-3 rounded-xl cursor-pointer text-destructive focus:bg-destructive/10"
                            onClick={(e) => handleRemoveItem(video.id || video._id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="font-bold text-sm">Remove Offline File</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>

              {/* Policy Banner */}
              <div className="mt-12 p-8 rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden group">
                <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-primary/5 blur-[100px] rounded-full group-hover:bg-primary/10 transition-colors duration-1000" />
                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center shrink-0">
                    <HardDrive className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight italic">Offline Smart Sync</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium max-w-2xl">
                      Downloads remain available as long as your device has an internet connection every 29 days.
                      This process happens automatically and does not re-download the video.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center rounded-[3rem] bg-white/5 border-2 border-dashed border-white/10 px-6">
              <div className="h-28 w-28 rounded-full bg-primary/10 flex items-center justify-center mb-8 animate-pulse">
                <Download className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-3xl font-black text-foreground mb-4 italic uppercase">No Offline Media</h2>
              <p className="text-muted-foreground max-w-sm mb-10 font-medium text-lg leading-relaxed">
                Your premium offline experience starts here. Download videos to watch them anywhere, anytime.
              </p>
              <Link href="/softporn">
                <Button className="rounded-[1.5rem] h-16 px-10 font-black text-lg gap-4 shadow-2xl shadow-primary/40 active-bounce group">
                  <TrendingUp className="h-6 w-6 group-hover:scale-125 transition-transform" />
                  START EXPLORING
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-8">
          {/* Storage Usage Card */}
          <div className="p-8 rounded-[2.5rem] bg-black/40 border border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <h3 className="font-black text-sm uppercase tracking-[0.2em] text-white/40">Storage</h3>
                <p className="text-3xl font-black italic">{storageStats.estimatedSizeGB} <span className="text-sm not-italic opacity-40">GB</span></p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-primary" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-foreground shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${storageStats.percentUsed}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/40">
                <span>{downloads.length} Items</span>
                <span>9.2 GB Free</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Settings2 className="h-4 w-4 text-white/60 group-hover:text-primary" />
                  </div>
                  <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">Download Settings</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="px-6 space-y-6">
            <h4 className="font-black text-xs uppercase tracking-[0.3em] text-white/30 px-2">Premium Features</h4>
            <div className="space-y-4">
              <FeatureRow icon={<Zap className="h-4 w-4 text-primary" />} label="Smart Downloads" desc="Auto-sync recommended videos" />
              <FeatureRow icon={<Film className="h-4 w-4 text-primary" />} label="Full HD Quality" desc="Always save in maximum resolution" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function FeatureRow({ icon, label, desc }: { icon: React.ReactNode, label: string, desc: string }) {
  return (
    <div className="flex gap-4 items-start group cursor-default">
      <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-xs font-black text-white/90 uppercase tracking-tight">{label}</p>
        <p className="text-[11px] text-white/40 font-medium leading-tight">{desc}</p>
      </div>
    </div>
  )
}

