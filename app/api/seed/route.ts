import { NextResponse } from "next/server"
import { getStore, seedStore } from "@/lib/store"

export async function POST() {
  try {
    seedStore()
    const s = getStore()
    return NextResponse.json({
      message: "Seeded successfully",
      counts: {
        categories: s.categories.length,
        channels: s.channels.length,
        videos: s.videos.length,
      },
    })
  } catch (error: unknown) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Seed failed" }, { status: 500 })
  }
}
