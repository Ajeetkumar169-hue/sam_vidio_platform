import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        await connectDB()
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status") || "pending"
        const search = searchParams.get("search")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "10")
        const skip = (page - 1) * limit

        const query: any = { isShort: true }
        let sort: any = { createdAt: -1 }

        if (status === "high-dislikes") {
            query.dislikes = { $gt: 0 }
            sort = { dislikes: -1 }
        } else if (status === "pending") {
            query.status = { $in: ["pending", "ready", "processing"] }
        } else if (status !== "all") {
            query.status = status
        }

        console.log("🔍 [ADMIN SHORTS API] Query:", JSON.stringify(query))

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { "uploader.username": { $regex: search, $options: "i" } }
            ]
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
