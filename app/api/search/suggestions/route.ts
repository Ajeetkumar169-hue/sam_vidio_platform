import { NextRequest } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import Channel from "@/lib/models/Channel"
import Actor from "@/lib/models/Actor"
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

    interface Suggestion {
        text: string
        thumbnail?: string
        type: "suggestion" | "tag" | "channel" | "actor"
        slug?: string
    }

    // 2. Extract unique suggestions
    const suggestions: Suggestion[] = videos.map(v => ({
      text: v.title,
      thumbnail: v.thumbnailUrl,
      type: "suggestion"
    }))

    // 3. Find matching channels
    const channels = await Channel.find({
        name: regex
    })
    .select("name slug logo")
    .limit(5)
    .lean()

    channels.forEach(c => {
        if (suggestions.length < 15) {
            suggestions.push({
                text: c.name,
                thumbnail: c.logo,
                type: "channel",
                slug: c.slug
            })
        }
    })

    // 4. Find matching actors
    const actors = await Actor.find({
        name: regex
    })
    .select("name slug avatar")
    .limit(5)
    .lean()

    actors.forEach(a => {
        if (suggestions.length < 20) {
            suggestions.push({
                text: a.name,
                thumbnail: a.avatar,
                type: "actor",
                slug: a.slug
            })
        }
    })

    // 5. Add some tags if we still have space
    if (suggestions.length < 10) {
        const tags = await Video.distinct("tags", {
            status: "approved",
            isDeleted: { $ne: true },
            tags: regex
        })
        tags.forEach(tag => {
            if (suggestions.length < 20 && !suggestions.find(s => s.text.toLowerCase() === tag.toLowerCase())) {
                suggestions.push({ text: tag, type: "tag" })
            }
        })
    }

    return ApiResponse.success({ suggestions }, "Suggestions fetched")

  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
}
