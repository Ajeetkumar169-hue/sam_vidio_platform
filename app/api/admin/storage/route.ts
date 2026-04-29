import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"

export async function GET() {
    try {
        const session = await getCurrentUser()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()

        const stats = await Video.aggregate([
            {
                $group: {
                    _id: null,
                    totalStorage: { $sum: "$storageSize" },
                    totalObjects: { $sum: 1 }
                }
            }
        ])

        const totalStorage = stats[0]?.totalStorage || 0
        const totalObjects = stats[0]?.totalObjects || 0
        const limit = 10 * 1024 * 1024 * 1024 * 1024; // 10 TB limit for visualization

        return NextResponse.json({
            usage: {
                storage: { 
                    usage: totalStorage, 
                    limit: limit, 
                    used_percent: (totalStorage / limit) * 100 
                },
                objects: { usage: totalObjects },
                bandwidth: { usage: 0 }
            }
        })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
