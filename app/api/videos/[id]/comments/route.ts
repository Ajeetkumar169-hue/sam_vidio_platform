import { NextRequest, NextResponse } from "next/server"
import { getStore, seedStore, findUserById, uuid } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    seedStore()
    const { id } = await params
    const s = getStore()
    const { searchParams } = new URL(req.url)
    const parentId = searchParams.get("parent") || null

    const comments = s.comments
      .filter((c) => c.videoId === id && c.parentComment === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((c) => {
        const user = findUserById(c.userId)
        return {
          ...c,
          _id: c.id,
          user: user ? { _id: user.id, username: user.username, avatar: user.avatar } : null,
        }
      })

    return NextResponse.json({ comments })
  } catch (error: unknown) {
    console.error("Comments fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    seedStore()
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const s = getStore()
    const { text, parentComment } = await req.json()
    if (!text || !text.trim()) return NextResponse.json({ error: "Text required" }, { status: 400 })

    const comment = {
      id: uuid(),
      videoId: id,
      userId: user.userId,
      text: text.trim(),
      parentComment: parentComment || null,
      likes: 0,
      createdAt: new Date().toISOString(),
    }
    s.comments.push(comment)

    const u = findUserById(user.userId)
    return NextResponse.json({
      comment: {
        ...comment,
        _id: comment.id,
        user: u ? { _id: u.id, username: u.username, avatar: u.avatar } : null,
      },
    }, { status: 201 })
  } catch (error: unknown) {
    console.error("Comment create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
