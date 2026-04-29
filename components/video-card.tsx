import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, ThumbsUp, Clock } from "lucide-react"

interface VideoCardProps {
  video: {
    _id?: string
    id?: string
    title: string
    thumbnailUrl: string
    views: number
    likes: number
    duration: number | string
    createdAt: string
    channel?: {
      name: string
      slug: string
      logo?: string
    }
    uploader?: {
      username: string
      avatar?: string
    }
    category?: {
      name: string
      slug: string
    }
    channelName?: string
    channelAvatar?: string
  }
  compact?: boolean
  index?: number
}

const getCloudinaryUrl = (url: string, width = 480, height = 270) => {
  if (!url || !url.includes("res.cloudinary.com")) return url
  const parts = url.split("/upload/")
  if (parts.length !== 2) return url
  return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_auto,f_auto,dpr_auto/${parts[1]}`
}

function formatViews(n: number | null | undefined): string {
  if (n === null || n === undefined) return "0"
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toString()
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function timeAgo(date: string): string {
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

export function VideoCard({ video, compact, index = 10 }: VideoCardProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const videoId = video._id || video.id || ""
  const isPriority = index < 4
  
  const thumbnailUrl = getCloudinaryUrl(
    video.thumbnailUrl, 
    compact ? 300 : 480, 
    compact ? 168 : 270
  )
  
  const avatarUrl = getCloudinaryUrl(
    (video.channel?.logo || video.uploader?.avatar || video.channelAvatar) as string,
    80, 
    80
  )

  return (
    <Link href={`/watch/${videoId}`} className="group block">
      <div className={cn("overflow-hidden rounded-lg", compact ? "flex gap-3" : "flex flex-col")}>
        {/* Thumbnail */}
        <div
          className={cn(
            "relative flex-shrink-0 overflow-hidden rounded-lg bg-secondary",
            compact ? "h-20 w-36" : "aspect-video w-full"
          )}
        >
          {video.thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={video.title}
              width={compact ? 144 : 640}
              height={compact ? 80 : 360}
              priority={isPriority}
              loading={isPriority ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgdmlld0JveD0iMCAwIDY0MCAzNjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0MCIgaGVpZ2h0PSIzNjAiIGZpbGw9IiMyQTJBMkEiLz48L3N2Zz4="
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary">
              <span className="text-2xl text-muted-foreground">
                <Clock className="h-8 w-8" />
              </span>
            </div>
          )}
          {video.duration && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-foreground">
              {typeof video.duration === "string" ? video.duration : formatDuration(video.duration)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className={cn("flex", compact ? "flex-1 min-w-0 gap-3 py-0.5" : "mt-3 gap-3 px-0.5")}>
          {!compact && (video.channel || video.uploader) && (
            <div className="flex-shrink-0 mt-0.5">
              <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden relative">
                {video.channel?.logo || video.uploader?.avatar || video.channelAvatar ? (
                  <Image
                    src={avatarUrl}
                    alt={video.channel?.name || video.uploader?.username || video.channelName || "Avatar"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {(video.channel?.name || video.uploader?.username || "?").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <h3
              className={cn(
                "line-clamp-2 font-medium leading-snug text-foreground group-hover:text-primary transition-colors break-words",
                compact ? "text-sm" : "text-base"
              )}
            >
              {video.title}
            </h3>
            {(video.channel || video.uploader) && (
              <p className="mt-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {video.channel?.name || video.uploader?.username || video.channelName}
              </p>
            )}
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                {formatViews(video.views)} views
              </span>
              <span>•</span>
              <span>{mounted ? timeAgo(video.createdAt) : "• • •"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
