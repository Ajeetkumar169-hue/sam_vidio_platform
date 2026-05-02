import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Category from "@/lib/models/Category"
import { getCurrentUser } from "@/lib/auth"

export const dynamic = 'force-dynamic'

const DEFAULT_CATEGORIES = [
  { name: "Viral Videos", slug: "viral-videos", description: "Trending and viral content that everyone is watching" },
  { name: "Entertainment", slug: "entertainment", description: "Fun and entertainment videos" },
  { name: "Music", slug: "music", description: "Music videos and performances" },
  { name: "Gaming", slug: "gaming", description: "Gaming content and walkthroughs" },
  { name: "Education", slug: "education", description: "Educational and tutorial content" },
  { name: "Sports", slug: "sports", description: "Sports highlights and events" },
  { name: "News", slug: "news", description: "Latest news and updates" },
  { name: "Comedy", slug: "comedy", description: "Comedy and humor content" },
  { name: "Lifestyle", slug: "lifestyle", description: "Lifestyle and vlog content" },
  { name: "Technology", slug: "technology", description: "Tech reviews and tutorials" },
  { name: "Art", slug: "art", description: "Art and creative content" },
]

export async function GET() {
  try {
    await connectDB()
    
    let categories = await Category.find().sort({ name: 1 }).lean()
    
    // Auto-seed if empty
    if (categories.length === 0) {
      console.log("⏳ Seeding initial categories to MongoDB...")
      await Category.insertMany(DEFAULT_CATEGORIES)
      categories = await Category.find().sort({ name: 1 }).lean()
    }

    return NextResponse.json({ 
      categories: categories.map(c => ({
        ...c,
        id: c._id.toString()
      }))
    })
  } catch (error: any) {
    console.error("❌ Categories fetch error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()
    
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 })
    }

    const { name, description, thumbnail } = await req.json()
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 })

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    
    const category = await Category.create({ 
      name, 
      slug, 
      description: description || "",
      thumbnail: thumbnail || "",
      videoCount: 0 
    })

    return NextResponse.json({ 
      category: {
        ...category.toObject(),
        id: category._id.toString()
      } 
    }, { status: 201 })
  } catch (error: any) {
    console.error("❌ Category create error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
