import { NextRequest } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import { ApiResponse } from "@/lib/api-response"

/**
 * 💡 SEARCH SUGGESTIONS API
 * Returns matching titles and tags for autocomplete.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    
    if (!query || query.length < 1) {
      return ApiResponse.success({ suggestions: [] })
    }

    const regex = new RegExp("^" + query, "i") // Starts with query

    // 1. Find matching titles
    const videos = await Video.find({
      status: "approved",
      isDeleted: { $ne: true },
      title: regex
    })
    .select("title thumbnailUrl")
    .limit(10)
    .lean()

    // 2. Extract unique suggestions
    const suggestions = videos.map(v => ({
      text: v.title,
      thumbnail: v.thumbnailUrl,
      type: "suggestion"
    }))

    // 3. Add some tags if we have space
    if (suggestions.length < 10) {
        const tags = await Video.distinct("tags", {
            status: "approved",
            isDeleted: { $ne: true },
            tags: regex
        })
        tags.forEach(tag => {
            if (suggestions.length < 10 && !suggestions.find(s => s.text.toLowerCase() === tag.toLowerCase())) {
                suggestions.push({ text: tag, type: "tag" })
            }
        })
    }

    return ApiResponse.success({ suggestions }, "Suggestions fetched")

  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
}
