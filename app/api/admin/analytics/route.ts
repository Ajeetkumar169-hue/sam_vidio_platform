import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import User from "@/lib/models/User"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
    try {
        const session = await getCurrentUser()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        // Aggregate uploads per day for the last 14 days
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

        const uploadsByDay = await Video.aggregate([
            { $match: { createdAt: { $gte: fourteenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])

        const recentUploadsCount = uploadsByDay.reduce((acc, curr) => acc + curr.count, 0)

        const videoStats = await Video.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                    totalLikes: { $sum: "$likes" },
                    avgSize: { $avg: "$storageSize" }
                }
            }
        ])

        const totalUsers = await User.countDocuments()
        const recentUsers = await User.countDocuments({ createdAt: { $gte: fourteenDaysAgo } })

        const formatSize = (bytes: number) => {
            if (!bytes) return "0 MB"
            const mb = bytes / (1024 * 1024)
            if (mb > 1024) return (mb / 1024).toFixed(2) + " GB"
            return mb.toFixed(2) + " MB"
        }

        const stats = videoStats[0] || { totalViews: 0, totalLikes: 0, avgSize: 0 }

        const growth = [
            { label: "New Users (14d)", value: `+${recentUsers}`, positive: recentUsers > 0 },
            { label: "New Uploads (14d)", value: `+${recentUploadsCount}`, positive: recentUploadsCount > 0 },
            { label: "Total Views", value: `${stats.totalViews}`, positive: true },
            { label: "Total Likes", value: `${stats.totalLikes}`, positive: true },
        ]

        const engagement = [
            { label: "Total Users", value: Math.min(totalUsers * 10, 100) }, // Mock percentage logic
            { label: "Active Uploaders", value: Math.min(recentUploadsCount * 15, 100) },
            { label: "Avg File Size", value: Math.min((stats.avgSize / (100 * 1024 * 1024)) * 100, 100) }, // Example scale
            { label: "Likes per View", value: stats.totalViews ? Math.min((stats.totalLikes / stats.totalViews) * 100, 100) : 0 },
        ]

        return NextResponse.json({
            uploadsByDay,
            growth,
            engagement
        })
    } catch (error) {
        console.error("Analytics API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
