import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { Like, Dislike } from "@/lib/models/Interaction"
import { getCurrentUser } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id: videoId } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const type = body.type || "like" // "like" or "dislike"

    const video = await Video.findById(videoId)
    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 })

    // Initialize counts to prevent NaN if missing in database
    video.likes = video.likes ?? 0
    video.dislikes = video.dislikes ?? 0

    if (type === "like") {
      const existingLike = await Like.findOne({ user: user.userId, video: videoId })
      
      if (existingLike) {
        // Toggle off
        await Like.deleteOne({ _id: existingLike._id })
        video.likes = Math.max(0, video.likes - 1)
        await video.save()
        return NextResponse.json({ 
          liked: false, 
          dislikes: video.dislikes ?? 0, 
          likes: video.likes ?? 0 
        })
      } else {
        // Toggle on
        // 1. Remove dislike if exists
        const existingDislike = await Dislike.findOne({ user: user.userId, video: videoId })
        if (existingDislike) {
          await Dislike.deleteOne({ _id: existingDislike._id })
          video.dislikes = Math.max(0, video.dislikes - 1)
        }
        
        // 2. Add like
        await Like.create({ user: user.userId, video: videoId })
        video.likes++
        await video.save()
        return NextResponse.json({ 
          liked: true, 
          disliked: false, 
          dislikes: video.dislikes ?? 0, 
          likes: video.likes ?? 0 
        })
      }
    } else {
      const existingDislike = await Dislike.findOne({ user: user.userId, video: videoId })
      
      if (existingDislike) {
        // Toggle off
        await Dislike.deleteOne({ _id: existingDislike._id })
        video.dislikes = Math.max(0, video.dislikes - 1)
        await video.save()
        return NextResponse.json({ 
          disliked: false, 
          dislikes: video.dislikes ?? 0, 
          likes: video.likes ?? 0 
        })
      } else {
        // Toggle on
        // 1. Remove like if exists
        const existingLike = await Like.findOne({ user: user.userId, video: videoId })
        if (existingLike) {
          await Like.deleteOne({ _id: existingLike._id })
          video.likes = Math.max(0, video.likes - 1)
        }
        
        // 2. Add dislike
        await Dislike.create({ user: user.userId, video: videoId })
        video.dislikes++
        await video.save()
        return NextResponse.json({ 
          disliked: true, 
          liked: false, 
          dislikes: video.dislikes ?? 0, 
          likes: video.likes ?? 0 
        })
      }
    }
  } catch (error) {
    console.error("Interaction error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id: videoId } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ liked: false, disliked: false })

    const [like, dislike] = await Promise.all([
      Like.findOne({ user: user.userId, video: videoId }),
      Dislike.findOne({ user: user.userId, video: videoId })
    ])

    return NextResponse.json({ liked: !!like, disliked: !!dislike })
  } catch {
    return NextResponse.json({ liked: false, disliked: false })
  }
}
