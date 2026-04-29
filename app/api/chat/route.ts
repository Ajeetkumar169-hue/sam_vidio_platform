import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/db"
import Message from "@/lib/models/Message"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
    try {
        await dbConnect()
        const url = new URL(req.url)
        const limit = parseInt(url.searchParams.get("limit") || "100")
        
        // Fetch last 100 messages, prioritizing newest first to slice, then reversing for UI
        const messages = await Message.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate("sender", "username avatar role")
            .lean()
            
        return NextResponse.json({ success: true, messages: messages.reverse() })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        await dbConnect()
        const body = await req.json()
        const { content, messageType, mediaUrl } = body

        if (!content && !mediaUrl) {
            return NextResponse.json({ error: "Empty message" }, { status: 400 })
        }

        const newMessage = await Message.create({
            sender: user.userId,
            content: content || "",
            messageType: messageType || "text",
            mediaUrl: mediaUrl || ""
        })

        // Populate so caller can append it directly
        await newMessage.populate("sender", "username avatar role")

        return NextResponse.json({ success: true, message: newMessage })
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
