import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Notification from "@/lib/models/Notification"
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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    const query: any = { recipient: user.userId }
    if (unreadOnly) {
      query.read = false
    }

    const total = await Notification.countDocuments(query)
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    return NextResponse.json({
      success: true,
      notifications,
      total,
      hasMore: total > page * limit,
    })
  } catch (error: any) {
    console.error("Notifications fetch error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, id } = body

    if (type === "all") {
      await Notification.updateMany(
        { recipient: user.userId, read: false },
        { $set: { read: true } }
      )
    } else if (type === "single" && id) {
      await Notification.updateOne(
        { _id: id, recipient: user.userId },
        { $set: { read: true } }
      )
    } else {
      return NextResponse.json({ success: false, error: "Invalid request type" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Notifications update error:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}
