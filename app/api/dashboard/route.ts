import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    await connectDB()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find the channel belonging to the current user in MongoDB
    let channel = await Channel.findOne({ owner: user.userId }).lean()
    
    // Lazy creation: If no channel exists, create one now
    if (!channel) {
      console.log(`ℹ️ Creating missing channel for user: ${user.username}`)
      const channelSlug = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-")
      
      const newChannel = await Channel.create({
        owner: user.userId,
        name: user.username,
        slug: channelSlug,
        description: `Welcome to ${user.username}'s channel!`,
        logo: "",
        banner: "",
        subscriberCount: 0,
        videoCount: 0,
      })
      channel = newChannel.toObject()
    }

    // Fetch the user's videos from MongoDB
    const videos = await Video.find({ channel: channel._id })
      .sort({ createdAt: -1 })
      .populate("category", "name slug")
      .lean() as any[]

    // Calculate aggregated stats from MongoDB data
    const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0)
    const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0)

    return NextResponse.json({
      channel: { 
        ...channel, 
        _id: channel._id.toString(),
        owner: user.userId 
      },
      videos: videos.map(v => ({ 
        ...v, 
        _id: v._id.toString(),
        category: v.category ? { ...v.category, _id: v.category._id.toString() } : null
      })),
      stats: {
        totalVideos: videos.length,
        totalViews,
        totalLikes,
        subscribers: channel.subscriberCount || 0,
      },
    })
  } catch (error: any) {
    console.error("❌ Dashboard error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
