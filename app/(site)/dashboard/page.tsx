"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  LayoutDashboard,
  Upload,
  Eye,
  ThumbsUp,
  Users,
  Film,
  Loader2,
  Trash2,
  Edit,
  Zap,
} from "lucide-react"

interface DashboardData {
  channel: {
    _id: string
    name: string
    slug: string
    description: string
    logo: string
    banner: string
    subscriberCount: number
  }
  videos: {
    _id: string
    title: string
    thumbnailUrl: string
    views: number
    likes: number
    visibility: string
    createdAt: string
    category?: { name: string }
    status: string
    processingProgress?: number
    isShort?: boolean
  }[]
  stats: {
    totalVideos: number
    totalViews: number
    totalLikes: number
    subscribers: number
  }
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Channel edit state
  const [editName, setEditName] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editLogo, setEditLogo] = useState("")
  const [editBanner, setEditBanner] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    if (user) {
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then((d) => {
          if (d.channel) {
            setData(d)
            setEditName(d.channel.name)
            setEditDesc(d.channel.description)
            setEditLogo(d.channel.logo)
            setEditBanner(d.channel.banner)
          }
        })
        .catch(() => { })
        .finally(() => setLoading(false))
    }
  }, [user, authLoading, router])

  const handleSaveChannel = async () => {
    if (!data) return
    setSaving(true)
    try {
      const res = await fetch(`/api/channels/${data.channel.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDesc, logo: editLogo, banner: editBanner }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Channel updated!")
    } catch {
      toast.error("Failed to update channel")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      setData((prev) =>
        prev
          ? {
            ...prev,
            videos: prev.videos.filter((v) => ((v as any)._id || (v as any).id) !== videoId),
            stats: { ...prev.stats, totalVideos: prev.stats.totalVideos - 1 },
          }
          : prev
      )
      toast.success("Video deleted")
    } catch {
      toast.error("Failed to delete video")
    }
  }

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">No channel data found</p>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-2 sm:px-4 md:px-6 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>
        <Link href="/upload" className="w-full sm:w-auto">
          <Button className="gap-2 w-full sm:w-auto">
            <Upload className="h-4 w-4" />
            Upload Video
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Film className="h-5 w-5" />} label="Videos" value={data.stats.totalVideos} />
        <StatCard icon={<Eye className="h-5 w-5" />} label="Total Views" value={data.stats.totalViews} />
        <StatCard icon={<ThumbsUp className="h-5 w-5" />} label="Total Likes" value={data.stats.totalLikes} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Subscribers" value={data.stats.subscribers} />
      </div>

      <Tabs defaultValue="videos">
        <TabsList className="mb-4 bg-secondary/50 rounded-xl p-1 h-12">
          <TabsTrigger value="videos" className="rounded-lg px-6 font-bold">My Videos</TabsTrigger>
          <TabsTrigger value="softporn" className="rounded-lg px-6 font-bold flex items-center gap-2">
            <Zap className="h-4 w-4" /> SoftPorn
          </TabsTrigger>
          <TabsTrigger value="channel" className="rounded-lg px-6 font-bold">Channel Settings</TabsTrigger>
        </TabsList>

        {/* Videos Tab */}
        <TabsContent value="videos">
          <VideoList 
            videos={data.videos.filter(v => !v.isShort)} 
            onDelete={handleDeleteVideo}
          />
        </TabsContent>

        {/* SoftPorn Tab */}
        <TabsContent value="softporn">
          <VideoList 
            videos={data.videos.filter(v => v.isShort)} 
            onDelete={handleDeleteVideo}
          />
        </TabsContent>

        {/* Channel Settings Tab */}
        <TabsContent value="channel">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Channel Settings</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Channel Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} className="bg-secondary" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Logo URL</Label>
                <Input value={editLogo} onChange={(e) => setEditLogo(e.target.value)} placeholder="https://..." className="bg-secondary" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Banner URL</Label>
                <Input value={editBanner} onChange={(e) => setEditBanner(e.target.value)} placeholder="https://..." className="bg-secondary" />
              </div>
              <Button onClick={handleSaveChannel} disabled={saving} className="w-fit">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold text-foreground">{formatNumber(value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function VideoList({ videos, onDelete }: { videos: any[], onDelete: (id: string) => void }) {
    const router = useRouter()
    
    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center gap-4 py-12 text-center grayscale opacity-50">
                <Film className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm font-bold uppercase tracking-widest">No matching content found</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {videos.map((video) => {
                const videoId = video._id || video.id
                return (
                    <div
                        key={videoId}
                        className="flex items-center gap-4 rounded-xl border border-white/5 bg-secondary/20 p-4 transition-all hover:bg-secondary/30"
                    >
                        <div className="h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-secondary shadow-lg">
                            {video.thumbnailUrl ? (
                                <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Film className="h-6 w-6" />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <Link href={`/watch/${videoId}`}>
                                <h3 className="truncate text-sm font-black text-foreground hover:text-primary uppercase tracking-tight">
                                    {video.title}
                                </h3>
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5 text-primary" /> {formatNumber(video.views)}</span>
                                <span className="flex items-center gap-1.5"><ThumbsUp className="h-3.5 w-3.5 text-primary" /> {formatNumber(video.likes)}</span>
                                <Badge variant="outline" className="text-[9px] border-white/10 px-2">
                                    {video.visibility}
                                </Badge>
                                {video.category && (
                                    <span className="text-primary/60">{video.category.name}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10" 
                                onClick={() => router.push(`/watch/${videoId}`)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20"
                                onClick={() => onDelete(videoId)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

