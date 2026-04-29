import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { History } from "@/lib/models/Interaction"

// DELETE /api/history/clear - Clear all watch history for the user
export async function DELETE() {
  try {
    await dbConnect()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await History.deleteMany({ user: user.userId })

    return NextResponse.json({ success: true, message: "History cleared successfully" })
  } catch (error) {
    console.error("Clear history error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
