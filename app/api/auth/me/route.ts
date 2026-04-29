import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Channel from "@/lib/models/Channel"

export async function GET() {
  try {
    await connectDB()
    const payload = await getCurrentUser()
    if (!payload) return NextResponse.json({ user: null })

    // Fetch user from MongoDB
    const user = await User.findById(payload.userId).lean()
    if (!user) return NextResponse.json({ user: null })

    // Fetch channel from MongoDB
    const channel = await Channel.findOne({ owner: user._id }).lean()

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar || "",
        galleryImages: (user as any).galleryImages || [],
        channel: channel
          ? { 
              id: channel._id.toString(), 
              name: channel.name, 
              slug: channel.slug, 
              logo: channel.logo 
            }
          : null,
      },
    })
  } catch (error) {
    console.error("❌ Session fetch error:", error)
    return NextResponse.json({ user: null })
  }
}
