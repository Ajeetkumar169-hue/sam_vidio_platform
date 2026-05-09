import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Actor from "@/lib/models/Actor"
import { getCurrentUser } from "@/lib/auth"
import { ApiResponse } from "@/lib/api-response"

export async function GET(req: NextRequest) {
    try {
        await connectDB()
        const actors = await Actor.find().sort({ name: 1 }).lean()
        return ApiResponse.success({ actors })
    } catch (error: any) {
        return ApiResponse.error(error.message)
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== "admin") return ApiResponse.unauthorized()

        await connectDB()
        const { name, bio, avatar } = await req.json()

        if (!name) return ApiResponse.badRequest("Name is required")

        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-")
        
        const existing = await Actor.findOne({ $or: [{ name }, { slug }] })
        if (existing) return ApiResponse.badRequest("Actor already exists")

        const actor = await Actor.create({ name, slug, bio, avatar })
        return ApiResponse.success({ actor }, "Actor created", 201)
    } catch (error: any) {
        return ApiResponse.error(error.message)
    }
}
