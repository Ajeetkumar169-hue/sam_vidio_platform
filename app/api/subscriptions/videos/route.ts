import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { Subscription } from "@/lib/models/Interaction"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "20")
    const lastId = searchParams.get("lastId")
    const lastCreatedAt = searchParams.get("lastCreatedAt")

    // 1. Get all subscribed channel IDs
    const subscriptions = await Subscription.find({ subscriber: user.userId })
      .select("channel")
      .lean()
    
    const channelIds = subscriptions.map(s => s.channel)

    if (channelIds.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        nextCursor: null
      })
    }

    // 2. Fetch videos from those channels
    const query: any = {
      channel: { $in: channelIds },
      status: "approved",
      isDeleted: { $ne: true }
    }

    if (lastCreatedAt && lastId) {
      query.$or = [
        { createdAt: { $lt: new Date(lastCreatedAt) } },
        {
          createdAt: new Date(lastCreatedAt),
          _id: { $lt: lastId }
        }
      ]
    }

    const videos = await Video.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .populate("channel", "name slug logo subscriberCount")
      .lean()

    return NextResponse.json({
      success: true,
      videos,
      nextCursor: videos.length === limit ? {
        lastId: videos[videos.length - 1]._id,
        lastCreatedAt: videos[videos.length - 1].createdAt
      } : null
    })
  } catch (error: any) {
    console.error("❌ Subscription feed error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
