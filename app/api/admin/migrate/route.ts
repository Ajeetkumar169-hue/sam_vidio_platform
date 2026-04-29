import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
    try {
        await connectDB()
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const result = await Video.updateMany(
            { 
                $or: [
                    { likes: { $exists: false } },
                    { dislikes: { $exists: false } }
                ]
            },
            {
                $set: { 
                    likes: 0,
                    dislikes: 0
                }
            }
        )

        return NextResponse.json({ 
            success: true, 
            message: "Migration completed", 
            modifiedCount: result.modifiedCount 
        })
    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 })
    }
}
