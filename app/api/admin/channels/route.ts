import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    await connectDB()

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const query = search ? { name: { $regex: search, $options: "i" } } : {}

    const channels = await Channel.find(query)
      .populate("owner", "username email")
      .sort({ createdAt: -1 })
      .lean() as any[]

    return NextResponse.json({
      channels: channels.map(c => ({
        ...c,
        _id: c._id.toString(),
        owner: c.owner ? {
          ...c.owner,
          _id: c.owner._id?.toString()
        } : null
      }))
    })
  } catch (error: any) {
    console.error("Admin channels error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    await connectDB()
    const { channelId, deleteVideos } = await req.json()

    if (!channelId) {
      return NextResponse.json({ error: "Channel ID required" }, { status: 400 })
    }

    const channel = await Channel.findById(channelId)
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 })

    // If indicated, also delete all videos referencing this channel
    if (deleteVideos) {
      await Video.deleteMany({ channel: channelId })
    }

    await Channel.findByIdAndDelete(channelId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Admin channel delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
