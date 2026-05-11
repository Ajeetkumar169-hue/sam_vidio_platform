import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { ApiResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

/**
 * 📈 INCREMENT VIDEO VIEWS
 * Simple atomic increment for video views.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    
    // Use atomic $inc to prevent race conditions
    const video = await Video.findByIdAndUpdate(
      id, 
      { $inc: { views: 1 } }, 
      { new: true }
    )

    if (!video) {
      return ApiResponse.notFound("Video not found")
    }

    return ApiResponse.success({ views: video.views }, "View incremented successfully")
  } catch (error: any) {
    console.error("View increment error:", error)
    return ApiResponse.error(error.message)
  }
}
