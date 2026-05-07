"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { VideoCard } from "@/components/video-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Users, Grid3X3, Film, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [results, setResults] = useState<{
    videos: any[],
    channels: any[],
    categories: any[]
  }>({ videos: [], channels: [], categories: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setResults({
          videos: d.data?.videos || [],
          channels: d.data?.channels || [],
          categories: d.data?.categories || []
        }))
        .catch(() => { })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [query])

  if (loading) {
    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-8">
            <Skeleton className="h-10 w-64" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-video w-full rounded-2xl" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    )
  }

  const hasResults = results.videos.length > 0 || results.channels.length > 0 || results.categories.length > 0

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
             <Search className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {query ? `Results for "${query}"` : "Search"}
          </h1>
        </div>
        <p className="text-muted-foreground ml-14">
            Found {results.videos.length} videos, {results.channels.length} channels
        </p>
      </div>

      {!hasResults && query ? (
         <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
                <p className="text-xl font-bold">No matches found</p>
                <p className="text-muted-foreground">Try different keywords or check your spelling</p>
            </div>
            <Link href="/">
                <Button variant="outline" className="rounded-full px-8">Back to Home</Button>
            </Link>
         </div>
      ) : (
        <>
          {/* Channels Section */}
          {results.channels.length > 0 && (
            <section className="space-y-6">
               <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Users className="h-5 w-5 text-primary" />
                    Channels
                  </h2>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.channels.map(channel => (
                    <Link 
                      key={channel._id} 
                      href={`/channel/${channel.slug}`}
                      className="flex items-center gap-4 p-4 rounded-3xl glass-light hover:bg-foreground/5 transition-all group"
                    >
                       <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20 p-1">
                          <img src={channel.logo || "/default-avatar.png"} alt="" className="h-full w-full rounded-full object-cover" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate group-hover:text-primary transition-colors">{channel.name}</h4>
                          <p className="text-xs text-muted-foreground">@{channel.slug}</p>
                       </div>
                       <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-all mr-2" />
                    </Link>
                  ))}
               </div>
            </section>
          )}

          {/* Categories Section */}
          {results.categories.length > 0 && (
            <section className="space-y-6">
               <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Grid3X3 className="h-5 w-5 text-primary" />
                    Categories
                  </h2>
               </div>
               <div className="flex flex-wrap gap-3">
                  {results.categories.map(cat => (
                    <Link 
                      key={cat._id} 
                      href={`/categories/${cat.slug}`}
                      className="px-6 py-3 rounded-full glass-heavy border border-white/5 hover:border-primary/50 hover:bg-primary/5 transition-all font-bold text-sm"
                    >
                       {cat.name}
                    </Link>
                  ))}
               </div>
            </section>
          )}

          {/* Videos Section */}
          {results.videos.length > 0 && (
            <section className="space-y-6">
               <div className="flex items-center justify-between border-b border-foreground/5 pb-4">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <Film className="h-5 w-5 text-primary" />
                    Videos
                  </h2>
               </div>
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {results.videos.map((video) => (
                    <VideoCard key={video._id} video={video} />
                  ))}
               </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-10 w-64 rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  )
}
