import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB()
    const { slug } = await params
    
    // Find the channel by slug in MongoDB
    const channel = await Channel.findOne({ slug }).populate("owner", "username avatar").lean() as any
    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 })

    // Fetch the channel's videos from MongoDB
    const videos = await Video.find({ channel: channel._id, visibility: "public" })
      .sort({ createdAt: -1 })
      .populate("category", "name slug")
      .lean() as any[]

    return NextResponse.json({
      channel: { 
        ...channel, 
        _id: channel._id.toString(),
        owner: channel.owner ? { 
          _id: channel.owner._id.toString(), 
          username: channel.owner.username, 
          avatar: channel.owner.avatar 
        } : null 
      },
      videos: videos.map(v => ({
        ...v,
        _id: v._id.toString(),
        category: v.category ? { ...v.category, _id: v.category._id.toString() } : null
      })),
    })
  } catch (error: any) {
    console.error("❌ Channel fetch error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB()
    const { slug } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Find the channel in MongoDB
    const channel = await Channel.findOne({ slug })
    if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 })
    
    // Check if the current user is the owner
    if (channel.owner.toString() !== user.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json()
    const allowedFields = ["name", "description", "logo", "banner"] as const
    for (const key of allowedFields) {
      if (body[key] !== undefined) (channel as any)[key] = body[key]
    }

    await channel.save()
    return NextResponse.json({ channel })
  } catch (error: any) {
    console.error("❌ Channel update error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
