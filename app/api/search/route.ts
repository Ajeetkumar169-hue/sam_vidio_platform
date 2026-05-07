import { NextRequest } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import Channel from "@/lib/models/Channel"
import Category from "@/lib/models/Category"
import { ApiResponse } from "@/lib/api-response"

/**
 * 🔍 UNIVERSAL SEARCH API
 * Returns matching videos, channels, and categories.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    
    if (!query || query.length < 2) {
      return ApiResponse.success({ videos: [], channels: [], categories: [] })
    }

    const regex = new RegExp(query, "i")

    // 1. Search Videos (Text search + Title regex)
    const videos = await Video.find({
      status: "approved",
      isDeleted: { $ne: true },
      $or: [
        { title: regex },
        { tags: { $in: [regex] } }
      ]
    })
    .populate("channel", "name slug logo")
    .limit(20)
    .lean()

    // 2. Search Channels
    const channels = await Channel.find({
      $or: [
        { name: regex },
        { slug: regex }
      ]
    })
    .limit(5)
    .lean()

    // 3. Search Categories
    const categories = await Category.find({
      $or: [
        { name: regex },
        { slug: regex }
      ]
    })
    .limit(5)
    .lean()

    return ApiResponse.success({
      videos,
      channels,
      categories
    }, "Search results fetched")

  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
}
