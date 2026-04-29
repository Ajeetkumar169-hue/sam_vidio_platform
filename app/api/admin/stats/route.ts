import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Video from "@/lib/models/Video"
import Report from "@/lib/models/Report"
import Channel from "@/lib/models/Channel"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getCurrentUser()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const [
            userCount, 
            videoCount, 
            channelCount,
            pendingVideos, 
            pendingReports, 
            totalViewsData,
            recentUsers,
            recentVideos
        ] = await Promise.all([
            User.countDocuments(),
            Video.countDocuments(),
            Channel.countDocuments(),
            Video.countDocuments({ status: "pending" }),
            Report.countDocuments({ status: "pending" }),
            Video.aggregate([{ $group: { _id: null, total: { $sum: "$views" } } }]),
            User.find().sort({ createdAt: -1 }).limit(5).select("username email createdAt avatar status role").lean(),
            Video.find().sort({ createdAt: -1 }).limit(5).populate("uploader", "username").select("title createdAt views status").lean()
        ])

        return NextResponse.json({
            users: userCount,
            videos: videoCount,
            channels: channelCount,
            pendingVideos,
            pendingReports,
            totalViews: totalViewsData[0]?.total || 0,
            recentUsers: recentUsers.map(u => ({ ...u, _id: u._id.toString() })),
            recentVideos: recentVideos.map(v => ({ 
                ...v, 
                _id: v._id.toString(),
                uploader: v.uploader ? { ...v.uploader, _id: v.uploader._id.toString() } : null
            })),
        })
    } catch (error) {
        console.error("Stats API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
