import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Category from "@/lib/models/Category"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()
    const { id } = await params
    const user = await getCurrentUser()

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    // 1. Check if category exists
    const category = await Category.findById(id)
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    // 2. Clear category field from all videos that use it
    await Video.updateMany(
      { category: id },
      { $set: { category: null } }
    )

    // 3. Delete the category
    await Category.findByIdAndDelete(id)

    return NextResponse.json({ success: true, message: "Category deleted and video references cleared" })
  } catch (error: any) {
    console.error("❌ Category deletion error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
