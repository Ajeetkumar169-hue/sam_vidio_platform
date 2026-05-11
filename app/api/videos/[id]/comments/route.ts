import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Comment from "@/lib/models/Comment"
import User from "@/lib/models/User"
import Channel from "@/lib/models/Channel"
import { getCurrentUser } from "@/lib/auth"
import { ApiResponse } from "@/lib/api-response"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id: videoId } = await params
    const { searchParams } = new URL(req.url)
    const parentId = searchParams.get("parent") || null

    const comments = await Comment.find({ video: videoId, parentComment: parentId })
      .sort({ createdAt: -1 })
      .populate("user", "username avatar")
      .lean()

    // Attach channel slugs for profile links
    const commentsWithSlugs = await Promise.all(comments.map(async (c: any) => {
        if (!c.user) return c;
        const channel = await Channel.findOne({ owner: c.user._id }).select("slug").lean()
        return {
            ...c,
            user: {
                ...c.user,
                channelSlug: channel?.slug || null
            }
        }
    }))

    return NextResponse.json({ comments: commentsWithSlugs })
  } catch (error: any) {
    console.error("Comments fetch error:", error)
    return ApiResponse.error(error.message)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB()
    const { id: videoId } = await params
    const user = await getCurrentUser()
    if (!user) return ApiResponse.unauthorized()

    const { text, parentComment } = await req.json()
    if (!text || !text.trim()) return ApiResponse.badRequest("Text required")

    const comment = await Comment.create({
      video: videoId,
      user: user.userId,
      text: text.trim(),
      parentComment: parentComment || null,
    })

    const populated = await Comment.findById(comment._id)
      .populate("user", "username avatar")
      .lean()

    const channel = await Channel.findOne({ owner: user.userId }).select("slug").lean()
    
    const finalComment = {
        ...populated,
        user: {
            ...populated?.user,
            channelSlug: channel?.slug || null
        }
    }

    return NextResponse.json({ comment: finalComment }, { status: 201 })
  } catch (error: any) {
    console.error("Comment create error:", error)
    return ApiResponse.error(error.message)
  }
}
