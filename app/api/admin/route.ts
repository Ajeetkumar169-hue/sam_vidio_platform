import { NextResponse } from "next/server"
import { getStore, seedStore, findChannelById, findUserById, findCategoryById } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    seedStore()
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const s = getStore()

    const users = s.users.map(({ password: _p, ...u }) => u)
    const videos = s.videos.map((v) => {
      const ch = findChannelById(v.channelId)
      const uploader = findUserById(v.uploaderId)
      const cat = findCategoryById(v.categoryId)
      return {
        ...v, _id: v.id,
        channel: ch ? { name: ch.name, slug: ch.slug } : null,
        uploader: uploader ? { username: uploader.username } : null,
        category: cat ? { name: cat.name } : null,
      }
    })
    const channels = s.channels.map((ch) => {
      const owner = findUserById(ch.ownerId)
      return { ...ch, _id: ch.id, owner: owner ? { username: owner.username, email: owner.email } : null }
    })

    return NextResponse.json({ users, videos, channels, categories: s.categories })
  } catch (error: unknown) {
    console.error("Admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
