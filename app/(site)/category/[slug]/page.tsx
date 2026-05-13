"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Filter, Zap, TrendingUp, Play, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export default function CategoryPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [videos, setVideos] = useState<any[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("latest")

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        // First get category info
        const catRes = await fetch("/api/categories")
        const catData = await catRes.json()
        const categories = catData.data?.categories || catData.categories || []
        const cat = categories.find((c: any) => c.slug === slug)
        
        if (cat) {
          setCategoryName(cat.name)
          const vidRes = await fetch(`/api/videos?category=${cat._id || cat.id}&limit=50&sort=${filter}`)
          const vidData = await vidRes.json()
          setVideos(vidData.data?.videos || vidData.videos || [])
        }
      } catch (err) {
        console.error("Category load error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug, filter])

  const featuredVideo = useMemo(() => videos[0], [videos])
  const remainingVideos = useMemo(() => videos.slice(1), [videos])

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic Hero Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
        {featuredVideo ? (
          <>
            <img 
              src={featuredVideo.thumbnailUrl} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover scale-105 blur-sm opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
        )}

        <div className="relative h-full max-w-screen-xl mx-auto px-6 flex flex-col justify-end pb-12">
           <button 
             onClick={() => router.back()}
             className="absolute top-8 left-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
           >
              <div className="h-10 w-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center group-hover:bg-white/10 transition-all">
                <ChevronLeft className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm uppercase tracking-widest hidden sm:inline">Back</span>
           </button>

           <div className="space-y-4 animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="flex items-center gap-3">
                 <div className="h-2 w-12 bg-primary rounded-full shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
                 <span className="text-xs font-black uppercase tracking-[0.4em] text-primary">Category</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic leading-[0.8]">
                {categoryName || slug}
              </h1>
              <div className="flex flex-wrap items-center gap-4 pt-4">
                 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <Zap className="h-4 w-4 text-primary fill-current" />
                    <span className="text-xs font-bold text-white/90">{videos.length} Videos Available</span>
                 </div>
                 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-white/90">Top Rated Selection</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
           <div className="flex items-center gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/5">
              {(["latest", "popular", "trending"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    filter === t 
                      ? "bg-white text-black shadow-2xl" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  )}
                >
                  {t}
                </button>
              ))}
           </div>
           
           <Button variant="outline" className="rounded-2xl h-12 border-white/10 gap-2 hover:bg-white/5">
              <Filter className="h-4 w-4" />
              <span className="font-bold">More Filters</span>
           </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <Skeleton className="aspect-video w-full rounded-[1.5rem]" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full rounded-lg" />
                  <Skeleton className="h-4 w-2/3 rounded-lg opacity-50" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/2">
             <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Info className="h-10 w-10 text-white/20" />
             </div>
             <h2 className="text-2xl font-black text-white mb-2 italic">NO CONTENT YET</h2>
             <p className="text-white/40 max-w-xs font-medium">We're working on bringing the best videos to this category. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {videos.map((video, idx) => (
              <VideoCard 
                key={video._id || video.id} 
                video={video} 
                index={idx}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA (Premium Feel) */}
      <div className="max-w-screen-xl mx-auto px-6 pb-24">
         <div className="relative p-12 rounded-[3rem] bg-gradient-to-r from-red-900/40 to-black border border-white/10 overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-red-600/10 blur-[120px] rounded-full translate-x-1/2 group-hover:bg-red-600/20 transition-all duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
               <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight text-white uppercase italic">Can't find what you need?</h3>
                  <p className="text-white/60 font-medium max-w-md">Our global algorithm is constantly learning. Explore more premium content in our trending feed.</p>
               </div>
               <Button className="rounded-2xl h-16 px-10 font-black text-lg gap-4 shadow-2xl shadow-primary/40 active-bounce">
                  <Play className="h-6 w-6 fill-current" />
                  EXPLORE TRENDING
               </Button>
            </div>
         </div>
      </div>
    </div>
  )
}
