import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Actor from "@/lib/models/Actor"
import Video from "@/lib/models/Video"
import { getCurrentUser } from "@/lib/auth"
import { ApiResponse } from "@/lib/api-response"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") return ApiResponse.unauthorized()

        await connectDB()
        const actorId = params.id

        // Remove actor from all videos
        await Video.updateMany(
            { actors: actorId },
            { $pull: { actors: actorId } }
        )

        await Actor.findByIdAndDelete(actorId)
        return ApiResponse.success(null, "Actor deleted")
    } catch (error: any) {
        return ApiResponse.error(error.message)
    }
}
