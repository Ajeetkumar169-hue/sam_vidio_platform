import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"
import User from "@/lib/models/User" // Ensure User model is registered

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const limitInput = searchParams.get("limit")
    const limit = Math.max(1, Math.min(limitInput ? parseInt(limitInput) : 10, 50))

    if (isNaN(limit)) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 })
    }

    // Fetch popular channels from MongoDB
    // We explicitly reference models to ensure they are registered in Mongoose's cache
    const modelReference = User.modelName && Channel.modelName; 
    
    const channels = await Channel.find()
      .sort({ subscriberCount: -1 })
      .limit(limit) 
      .populate("owner", "username avatar")
      .lean() as any[]

    if (!channels) {
      return NextResponse.json({ channels: [] })
    }

    const mappedChannels = channels.map(ch => {
      try {
        return {
          ...ch,
          _id: ch._id?.toString() || "",
          owner: ch.owner && typeof ch.owner === 'object' ? { 
            _id: ch.owner._id?.toString() || ch.owner.toString(), 
            username: ch.owner.username || "Unknown", 
            avatar: ch.owner.avatar || "" 
          } : null
        }
      } catch (err) {
        console.error("❌ Error mapping channel:", ch._id, err)
        return null
      }
    }).filter(Boolean)

    return NextResponse.json({ 
      channels: mappedChannels 
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    })
  } catch (error: any) {
    console.error("❌ Channels fetch error:", error)
    return NextResponse.json({ 
      error: error.message || "Internal server error",
      details: error.name || "UnknownError",
      message: "Please check your MongoDB connection and ensure models are registered."
    }, { status: 500 })
  }
}
