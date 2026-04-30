"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { VideoGrid } from "@/components/video-grid"
import { VideoCarousel } from "@/components/video-carousel"
import { VideoCard } from "@/components/video-card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, Clock, Star, ChevronRight, Users, MessageCircle } from "lucide-react"
import { AppShell } from "@/components/app-shell"

interface Video {
  _id?: string
  id?: string
  title: string
  thumbnailUrl: string
  views: number
  likes: number
  duration: number | string
  createdAt: string
  channel?: { name: string; slug: string; logo?: string }
  uploader?: { username: string; avatar?: string }
  category?: { name: string; slug: string }
}

interface ChannelData {
  _id?: string
  id?: string
  name: string
  slug: string
  logo: string
  subscriberCount: number
  videoCount: number
  owner?: { username: string; avatar: string }
}

interface Category {
  _id?: string
  id?: string
  name: string
  slug: string
}

export default function HomePage() {
  const [trending, setTrending] = useState<Video[]>([])
  const [latest, setLatest] = useState<Video[]>([])
  const [topRated, setTopRated] = useState<Video[]>([])
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [trendingRes, latestRes, topRes, channelRes, catRes] = await Promise.all([
          fetch("/api/videos?sort=trending&limit=8").then((r) => r.ok ? r.json() : { videos: [] }).catch(() => ({ videos: [] })),
          fetch("/api/videos?sort=latest&limit=8").then((r) => r.ok ? r.json() : { videos: [] }).catch(() => ({ videos: [] })),
          fetch("/api/videos?sort=top-rated&limit=8").then((r) => r.ok ? r.json() : { videos: [] }).catch(() => ({ videos: [] })),
          fetch("/api/channels?limit=6").then((r) => r.ok ? r.json() : { channels: [] }).catch(() => ({ channels: [] })),
          fetch("/api/categories").then((r) => r.ok ? r.json() : { categories: [] }).catch(() => ({ categories: [] })),
        ])
        setTrending(trendingRes.videos || [])
        setLatest(latestRes.videos || [])
        setTopRated(topRes.videos || [])
        setChannels(channelRes.channels || [])
        setCategories(catRes.categories || [])
      } catch (err) {
        console.error("Failed to load homepage:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <AppShell>
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 py-6">
      {/* Hero Section */}
      <section className="mb-8 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 lg:p-8">
        <h1 className="text-balance text-2xl font-bold text-foreground lg:text-3xl">
          Welcome to SAM
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground lg:text-base">
          Discover trending videos, subscribe to your favorite channels, and share your own content with the world.
        </p>
        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <Link href="/chat" className="w-full md:w-auto">
            <Button size="sm" className="gap-2 w-full md:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
              <MessageCircle className="h-4 w-4" />
              Let&apos;s talk
            </Button>
          </Link>
          <Link href="/categories" className="w-full md:w-auto">
            <Button size="sm" variant="secondary" className="gap-2 w-full md:w-auto">
              Browse Categories
            </Button>
          </Link>
        </div>
      </section>

      {/* Trending Videos */}
      <Section title="Trending Now" icon={<TrendingUp className="h-5 w-5 text-primary" />} href="/trending">
        <VideoCarousel videos={trending} loading={loading} emptyMessage="No trending videos yet" />
      </Section>

      {/* Categories Row */}
      {categories.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            <Link href="/categories" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-3">
              {categories.map((cat) => (
                <Link
                  key={cat._id || cat.id}
                  href={`/category/${cat.slug}`}
                  className="inline-flex flex-shrink-0 items-center rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* Latest Videos */}
      <Section title="Latest Uploads" icon={<Clock className="h-5 w-5 text-primary" />} href="/latest">
        <VideoCarousel videos={latest} loading={loading} emptyMessage="No videos uploaded yet" />
      </Section>

      {/* Popular Channels */}
      {(loading || channels.length > 0) && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Popular Channels</h2>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
              {channels.map((ch) => (
                <Link
                  key={ch._id || ch.id}
                  href={`/channel/${ch.slug}`}
                  className="group flex flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-secondary"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary transition-transform group-hover:scale-110">
                    {ch.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-center text-sm font-medium text-foreground">{ch.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ch.subscriberCount} subscribers
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Top Rated */}
      <Section title="Top Rated" icon={<Star className="h-5 w-5 text-primary" />} href="/top-rated">
        <VideoCarousel videos={topRated} loading={loading} emptyMessage="No top rated videos yet" />
      </Section>

      {/* Empty state */}
      {!loading && trending.length === 0 && latest.length === 0 && (
        <div className="mt-8 rounded-xl border border-border bg-card p-8 text-center">
          <h3 className="mb-2 text-lg font-semibold text-foreground">Getting Started</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Sign up, create a channel, and start uploading videos to share with the world.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-3">
            <Link href="/register" className="w-full md:w-auto">
              <Button size="sm" className="w-full md:w-auto">Create Account</Button>
            </Link>
            <Link href="/categories" className="w-full md:w-auto">
              <Button size="sm" variant="secondary" className="w-full md:w-auto">Browse Categories</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
    </AppShell>
  )
}

function Section({
  title,
  icon,
  href,
  children,
}: {
  title: string
  icon: React.ReactNode
  href: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <Link href={href} className="flex items-center gap-1 text-sm text-primary hover:underline">
          View All
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  )
}
