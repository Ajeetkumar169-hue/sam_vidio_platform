import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import User from "@/lib/models/User"

export async function POST() {
  try {
    await dbConnect()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userData = await User.findById(user.userId)
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    userData.historyPaused = !userData.historyPaused
    await userData.save()

    return NextResponse.json({ 
      success: true, 
      historyPaused: userData.historyPaused,
      message: userData.historyPaused ? "History paused" : "History resumed"
    })
  } catch (error) {
    console.error("Toggle history pause error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
