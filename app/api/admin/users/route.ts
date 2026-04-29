import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: Request) {
    try {
        await connectDB()
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const page = parseInt(searchParams.get("page") || "1", 10)
        const limit = parseInt(searchParams.get("limit") || "10", 10)
        const skip = (page - 1) * limit

        const query = search
            ? { $or: [{ username: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
            : {}

        const [users, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query)
        ])

        return NextResponse.json({ 
            users,
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
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { userId, role, status } = await req.json()
        const user = await User.findByIdAndUpdate(
            userId,
            { ...(role && { role }), ...(status && { status }) },
            { new: true }
        )

        return NextResponse.json({ user })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB()
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { userId } = await req.json()
        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const userToDelete = await User.findById(userId)
        if (!userToDelete) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Prevent admin from deleting themselves
        if (userId === currentUser.userId) {
            return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })
        }

        const Channel = (await import("@/lib/models/Channel")).default
        const Video = (await import("@/lib/models/Video")).default
        const cloudinary = (await import("@/lib/cloudinary")).default

        // Get videos to delete from Cloudinary
        const userVideos = await Video.find({ uploader: userId })
        
        // Clean up Cloudinary storage in parallel
        if (userVideos.length > 0) {
            const destroyPromises = userVideos
                .filter(v => v.filePublicId)
                .map(v => cloudinary.uploader.destroy(v.filePublicId as string, { resource_type: "video" }).catch((e: any) => console.error(e)))
            await Promise.all(destroyPromises)
        }

        // Clean up references
        await Channel.findOneAndDelete({ owner: userId })
        await Video.deleteMany({ uploader: userId })
        await User.findByIdAndDelete(userId)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("User deletion error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
