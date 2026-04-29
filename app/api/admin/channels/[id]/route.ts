import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { id: channelId } = await params
    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    await connectDB()

    // 1. Fetch Basic Channel Info with Owner
    const channel = await Channel.findById(channelId).populate("owner", "username email avatar role status").lean()
    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // 2. Fetch Aggregated Stats (Total Views)
    const stats = await Video.aggregate([
      { $match: { channel: channel._id } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
          totalDislikes: { $sum: "$dislikes" },
        }
      }
    ])

    const totalViews = stats[0]?.totalViews || 0

    // 3. Fetch Most Liked Video
    const mostLikedVideo = await Video.findOne({ channel: channel._id })
      .sort({ likes: -1, views: -1 })
      .select("title views likes dislikes thumbnailUrl")
      .lean()

    // 4. Fetch Most Disliked Video
    const mostDislikedVideo = await Video.findOne({ channel: channel._id })
      .sort({ dislikes: -1, views: -1 })
      .select("title views likes dislikes thumbnailUrl")
      .lean()

    return NextResponse.json({
      channel: {
        ...channel,
        totalViews,
        analytics: {
            mostLiked: mostLikedVideo,
            mostDisliked: mostDislikedVideo
        }
      }
    })
  } catch (error: any) {
    console.error("❌ Admin Channel Details Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
