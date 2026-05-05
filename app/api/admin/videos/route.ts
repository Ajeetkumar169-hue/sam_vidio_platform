import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import Category from "@/lib/models/Category"
import User from "@/lib/models/User"
import { getCurrentUser } from "@/lib/auth"
import cloudinary from "@/lib/cloudinary"

export async function GET(req: Request) {
    try {
        await connectDB()
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") || "pending"
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const skip = (page - 1) * limit

        const query: any = {}
        let sort: any = { createdAt: -1 }

        if (status === "high-dislikes") {
            query.dislikes = { $gt: 0 }
            sort = { dislikes: -1 }
        } else {
            query.status = status
        }

        const [videos, total] = await Promise.all([
            Video.find(query)
                .populate("uploader", "username email")
                .populate("category", "name")
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Video.countDocuments(query)
        ])

        return NextResponse.json({ 
            videos,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB()
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { videoId, videoIds, status } = await req.json()
        
        // Bulk update support
        const ids = videoIds || (videoId ? [videoId] : [])
        if (ids.length === 0) {
            return NextResponse.json({ error: "No video IDs provided" }, { status: 400 })
        }

        const result = await Video.updateMany(
            { _id: { $in: ids } },
            { status },
        )

        return NextResponse.json({ success: true, modified: result.modifiedCount })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB()
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { videoId, videoIds } = await req.json()
        const ids = videoIds || (videoId ? [videoId] : [])
        if (ids.length === 0) {
            return NextResponse.json({ error: "No video IDs provided" }, { status: 400 })
        }

        const Channel = (await import("@/lib/models/Channel")).default
        let deletedCount = 0

        for (const id of ids) {
            try {
                const video = await Video.findById(id)
                if (!video) continue

                // 1. Decrement counts
                if (video.category) {
                    await Category.updateOne(
                        { _id: video.category, videoCount: { $gt: 0 } },
                        { $inc: { videoCount: -1 } }
                    )
                }
                if (video.channel) {
                    await Channel.updateOne(
                        { _id: video.channel, videoCount: { $gt: 0 } },
                        { $inc: { videoCount: -1 } }
                    )
                }

                // 2. Delete Asset
                if (video.filePublicId) {
                    try {
                        const { deleteAsset } = await import("@/lib/cloudinary")
                        await deleteAsset(video.filePublicId, "video")
                    } catch (e) { /* ignore asset delete errors */ }
                }

                // 3. Delete DB record
                await Video.findByIdAndDelete(id)
                deletedCount++
            } catch (e) {
                console.error(`Failed to delete video ${id}:`, e)
            }
        }

        return NextResponse.json({ success: true, deleted: deletedCount })
    } catch (error: any) {
        console.error("❌ Admin delete error:", error)
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
