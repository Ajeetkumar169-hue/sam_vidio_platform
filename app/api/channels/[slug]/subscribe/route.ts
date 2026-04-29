import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Channel from "@/lib/models/Channel"
import { Subscription } from "@/lib/models/Interaction"
import { getCurrentUser } from "@/lib/auth"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB()
    const { slug } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const channel = await Channel.findOne({ slug })
    if (!channel) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const existing = await Subscription.findOne({ subscriber: user.userId, channel: channel._id })
    
    if (existing) {
      await Subscription.deleteOne({ _id: existing._id })
      await Channel.findByIdAndUpdate(channel._id, { $inc: { subscriberCount: -1 } })
      return NextResponse.json({ subscribed: false })
    }

    await Subscription.create({ subscriber: user.userId, channel: channel._id })
    await Channel.findByIdAndUpdate(channel._id, { $inc: { subscriberCount: 1 } })
    
    return NextResponse.json({ subscribed: true })
  } catch (error: any) {
    console.error("Subscribe error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await connectDB()
    const { slug } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ subscribed: false })

    const channel = await Channel.findOne({ slug })
    if (!channel) return NextResponse.json({ subscribed: false })

    const existing = await Subscription.findOne({ subscriber: user.userId, channel: channel._id })
    return NextResponse.json({ subscribed: !!existing })
  } catch {
    return NextResponse.json({ subscribed: false })
  }
}
