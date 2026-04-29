import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import dbConnect from "@/lib/db"
import { History } from "@/lib/models/Interaction"

// DELETE /api/history/[id] - Remove a specific item from history
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await dbConnect()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deleted = await History.findOneAndDelete({
      _id: id,
      user: user.userId
    })

    if (!deleted) {
      return NextResponse.json({ error: "History item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete history item error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
