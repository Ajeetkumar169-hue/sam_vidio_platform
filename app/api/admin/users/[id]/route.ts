import { NextRequest, NextResponse } from "next/server"
import { getStore, seedStore, findUserById } from "@/lib/store"
import { getCurrentUser } from "@/lib/auth"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    seedStore()
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const s = getStore()
    const idx = s.users.findIndex((u) => u.id === id)
    if (idx !== -1) s.users.splice(idx, 1)
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    seedStore()
    const { id } = await params
    const user = await getCurrentUser()
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const target = findUserById(id)
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json()
    Object.assign(target, body)
    const { password: _p, ...safe } = target
    return NextResponse.json({ user: safe })
  } catch (error: unknown) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
