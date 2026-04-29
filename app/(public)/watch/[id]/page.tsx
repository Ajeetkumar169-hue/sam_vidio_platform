import dbConnect from "@/lib/db"
import Video from "@/lib/models/Video"
import { notFound } from "next/navigation"
import { WatchView } from "./WatchView"
import { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getVideo(id: string) {
  if (!id) return null
  await dbConnect()
  try {
    const video = await Video.findById(id)
      .populate("channel")
      .populate("category")
      .populate("uploader", "username avatar")
      .lean()
    
    if (!video) return null
    
    // Serialize MongoDB objects to plain JSON for client component
    return JSON.parse(JSON.stringify(video))
  } catch (error) {
    console.error("Error fetching video server-side:", error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const video = await getVideo(id)
  if (!video) return { title: "Video Not Found" }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const shareUrl = `${baseUrl}/watch/${id}`
  
  // Use a high-res thumbnail if possible, otherwise fallback
  const ogImage = video.thumbnailUrl?.startsWith("http") 
    ? video.thumbnailUrl 
    : `${baseUrl}${video.thumbnailUrl || "/og-image.jpg"}`

  return {
    title: `${video.title} - Video Platform`,
    description: video.description?.slice(0, 160) || "Watch high-quality videos on our premium platform.",
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title: video.title,
      description: video.description?.slice(0, 200) || "Check out this video!",
      url: shareUrl,
      siteName: "Video Platform",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: video.title,
        },
      ],
      locale: "en_US",
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description: video.description?.slice(0, 200),
      images: [ogImage],
    },
  }
}

export default async function WatchPage({ params }: PageProps) {
  const { id } = await params
  const video = await getVideo(id)
  
  if (!video) {
    notFound()
  }

  return <WatchView initialVideo={video} />
}
