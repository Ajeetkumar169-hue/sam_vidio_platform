import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { History } from "@/lib/models/Interaction"
import Video from "@/lib/models/Video"

// GET /api/history - Fetch user's watch history
export async function GET() {
  try {
    await dbConnect()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const historyItems = await History.find({ user: user.userId })
      .sort({ updatedAt: -1 }) // Sort by last updated (youtube-like)
      .limit(50)
      .populate({
        path: "video",
        populate: [
          { path: "channel", select: "name slug logo" },
          { path: "uploader", select: "username avatar" }
        ]
      })
      .lean()

    // Filter out items where video might have been deleted
    const validHistory = historyItems.filter(item => item.video)

    return NextResponse.json({ history: validHistory })
  } catch (error) {
    console.error("Fetch history error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST /api/history - Add video to history
export async function POST(req: Request) {
  try {
    await dbConnect()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoId } = await req.json()
    if (!videoId) {
      return NextResponse.json({ error: "Video ID required" }, { status: 400 })
    }

    // Check if video exists
    const videoExists = await Video.findById(videoId)
    if (!videoExists) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Find and update or create new history entry
    // Use findOneAndUpdate with upsert to keep it efficient and unique per user/video
    const update = { updatedAt: new Date() }
    const historyEntry = await History.findOneAndUpdate(
      { user: user.userId, video: videoId },
      update,
      { upsert: true, new: true }
    )

    return NextResponse.json({ success: true, history: historyEntry })
  } catch (error) {
    console.error("Save history error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
