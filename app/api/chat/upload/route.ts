import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get("file") as File
        
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

        // Ensure the directory exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "chat")
        try {
            await mkdir(uploadDir, { recursive: true })
        } catch (e) {
            // Ignore if exists
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate a safe unique filename avoiding special chars
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const filename = `${uniqueSuffix}-${safeName}`
        
        const filePath = path.join(uploadDir, filename)
        
        await writeFile(filePath, buffer)

        // Determine type based on mime
        let type = "image"
        if (file.type.startsWith("video/")) type = "video"
        if (file.type.startsWith("audio/")) type = "audio"

        return NextResponse.json({ 
            success: true, 
            url: `/uploads/chat/${filename}`,
            type 
        })
    } catch (err: any) {
        console.error("Chat upload err:", err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
