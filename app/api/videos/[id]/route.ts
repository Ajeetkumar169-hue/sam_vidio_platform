import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params

    // Increment view count directly in MongoDB first
    await Video.findByIdAndUpdate(id, { $inc: { views: 1 } })

    // Find video and populate its relations using .lean() for a plain JS object
    const video = await Video.findById(id)
      .populate("channel", "name slug logo subscriberCount")
      .populate("category", "name slug")
      .populate("uploader", "username avatar")
      .select("title description videoUrl thumbnailUrl views likes dislikes channel category uploader createdAt duration")
      .lean() as any

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Prepare response with stringified IDs
    return NextResponse.json({
      video: {
        ...video,
        _id: video._id.toString(),
        channel: video.channel ? {
          ...video.channel,
          _id: video.channel._id?.toString()
        } : null,
        category: video.category ? {
          ...video.category,
          _id: video.category._id?.toString()
        } : null,
        uploader: video.uploader ? {
          ...video.uploader,
          _id: video.uploader._id?.toString()
        } : null,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30"
      }
    })
  } catch (error: any) {
    console.error("❌ Video fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { runWithRetry } = await import("@/lib/db")

    const result = await runWithRetry(async (session) => {
      const video = await Video.findById(id).session(session)
      if (!video) throw new Error("Video not found")

      // Authorization check
      if (video.uploader.toString() !== user.userId && user.role !== "admin") {
        throw new Error("Forbidden")
      }

      // Handle Category Transfer
      const oldCategoryId = video.category?.toString()
      const newCategoryId = body.category?.toString()

      if (newCategoryId !== undefined && oldCategoryId !== newCategoryId) {
        const Category = (await import("@/lib/models/Category")).default

        // Decrement old
        if (oldCategoryId) {
          await Category.updateOne(
            { _id: oldCategoryId, videoCount: { $gt: 0 } },
            { $inc: { videoCount: -1 } },
            { session: session || undefined }
          )
        }

        // Increment new
        if (newCategoryId) {
          await Category.updateOne(
            { _id: newCategoryId },
            { $inc: { videoCount: 1 } },
            { session: session || undefined }
          )
        }
      }

      // Update video fields
      const updated = await Video.findByIdAndUpdate(id, body, { new: true, session: session || undefined }).lean()
      return updated
    })

    return NextResponse.json({
      video: {
        ...result,
        _id: (result as any)._id.toString()
      }
    })
  } catch (error: any) {
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (error.message === "Video not found") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error("❌ Video update error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { runWithRetry } = await import("@/lib/db")

    await runWithRetry(async (session) => {
      const video = await Video.findById(id).session(session)
      if (!video) throw new Error("Video not found")

      // Authorization check
      if (video.uploader.toString() !== user.userId && user.role !== "admin") {
        throw new Error("Forbidden")
      }

      // Decrement Category and Channel counts with floor safety
      const Category = (await import("@/lib/models/Category")).default
      const Channel = (await import("@/lib/models/Channel")).default

      if (video.category) {
        await Category.updateOne(
          { _id: video.category, videoCount: { $gt: 0 } },
          { $inc: { videoCount: -1 } },
          { session: session || undefined }
        )
      }

      if (video.channel) {
        await Channel.updateOne(
          { _id: video.channel, videoCount: { $gt: 0 } },
          { $inc: { videoCount: -1 } },
          { session: session || undefined }
        )
      }

      // Delete from Cloudinary/Local to prevent storage leak
      if (video.filePublicId) {
        const { deleteAsset } = await import("@/lib/cloudinary")
        await deleteAsset(video.filePublicId, "video")
      }

      await Video.findByIdAndDelete(id).session(session)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (error.message === "Video not found") return NextResponse.json({ error: "Not found" }, { status: 404 })
    console.error("❌ Video delete error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
