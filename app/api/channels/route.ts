import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    // Fetch popular channels from MongoDB
    const channels = await Channel.find()
      .sort({ subscriberCount: -1 })
      .limit(limit)
      .populate("owner", "username avatar") // Populate owner from User model
      .lean() as any[]

    return NextResponse.json({ 
      channels: channels.map(ch => ({
        ...ch,
        _id: ch._id.toString(),
        owner: ch.owner ? { 
          _id: ch.owner._id.toString(), 
          username: ch.owner.username, 
          avatar: ch.owner.avatar 
        } : null
      })) 
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
      }
    })
  } catch (error: any) {
    console.error("❌ Channels fetch error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
