import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import connectDB from "@/lib/db"
import { Subscription } from "@/lib/models/Interaction"
import Channel from "@/lib/models/Channel" // Required for populate
import User from "@/lib/models/User"       // Required for integrity
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth-token")?.value
    console.log("🔍 Subscriptions API: token present:", !!token)

    const user = await getCurrentUser()
    if (!user) {
      console.log("❌ Subscriptions API: User not authenticated")
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    // Ensure userId is treated as ObjectId if it's a valid hex string
    const subscriberId = mongoose.Types.ObjectId.isValid(user.userId) 
      ? new mongoose.Types.ObjectId(user.userId) 
      : user.userId

    const total = await Subscription.countDocuments({ subscriber: subscriberId })
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
      .populate({
        path: "channel",
        select: "name slug logo banner subscriberCount videoCount",
        model: Channel
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions.map((s: any) => ({
        ...s,
        _id: s._id.toString(),
        channel: s.channel ? {
          ...s.channel,
          _id: s.channel._id.toString()
        } : null
      })),
      total,
      hasMore: total > page * limit,
    })
  } catch (error: any) {
    console.error("❌ Subscriptions list error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 })
  }
}
