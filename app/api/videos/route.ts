import { NextRequest } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import Channel from "@/lib/models/Channel"
import Category from "@/lib/models/Category"
import { getCurrentUser } from "@/lib/auth"
import { ApiResponse } from "@/lib/api-response"
import CONFIG from "@/lib/config"

export const dynamic = 'force-dynamic'

/**
 * 📺 GET VIDEOS (FEED)
 * Standardized feed with stable cursor pagination and HLS readiness.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get("sort") || "latest"
    const category = searchParams.get("category")
    const channel = searchParams.get("channel")
    const featured = searchParams.get("featured")
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100)
    const search = searchParams.get("search")
    const isShort = searchParams.get("isShort") === "true"

    const query: any = { 
      status: { $in: ["approved", "pending", "ready"] }, 
      isDeleted: { $ne: true },
    }

    if (isShort) {
        query.isShort = true
    } else {
        query.isShort = { $ne: true } // This catches both 'false' and 'undefined'
    }
    
    if (category) query.category = category
    if (channel) query.channel = channel
    if (featured === "true") query.isFeatured = true
    
    const lastId = searchParams.get("lastId")
    const lastCreatedAt = searchParams.get("lastCreatedAt")
    
    if (lastCreatedAt && lastId) {
      query.$or = [
        { createdAt: { $lt: new Date(lastCreatedAt) } },
        { createdAt: new Date(lastCreatedAt), _id: { $lt: lastId } }
      ]
    }

    if (search) query.$text = { $search: search }

    let sortOptions: any = { createdAt: -1, _id: -1 }
    if (sort === "trending" || sort === "popular") sortOptions = { views: -1, _id: -1 }
    else if (sort === "top-rated") sortOptions = { likes: -1, _id: -1 }

    const videos = await Video.find(query)
      .sort(sortOptions)
      .limit(limit)
      .populate("channel", "name slug logo")
      .lean()

    const nextCursor = videos.length === limit ? {
      lastId: videos[videos.length - 1]._id,
      lastCreatedAt: videos[videos.length - 1].createdAt
    } : null

    return ApiResponse.success({ videos, nextCursor }, "Videos fetched successfully");
  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}

/**
 * 📤 CREATE VIDEO (METADATA / LINK ONLY)
 * Binary uploads are handled via S3-Direct routes. 
 * This endpoint handles manual link uploads or metadata finalizing.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()
    if (!user) return ApiResponse.unauthorized()

    const body = await req.json()
    const { title, description, videoUrl, categoryId, thumbnailUrl, visibility, tags, actors, isShort } = body

    if (!title || !videoUrl) {
        return ApiResponse.badRequest("Title and Video URL are required");
    }

    const result = await (await import("@/lib/db")).runWithRetry(async (session) => {
      let channel = await Channel.findOne({ owner: user.userId }).session(session)
      
      if (!channel) {
        const channelSlug = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-")
        channel = (await Channel.create([{
          owner: user.userId,
          name: user.username,
          slug: channelSlug,
          subscriberCount: 0, videoCount: 0,
        }], { session }))[0]
      }
      
      const idempotencyKey = videoUrl + user.userId;

      // Process Actors
      let actorIds: any[] = []
      if (actors && typeof actors === "string") {
          const Actor = (await import("@/lib/models/Actor")).default
          const actorNames = actors.split(",").map((a: string) => a.trim()).filter(Boolean)
          
          for (const name of actorNames) {
              const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-")
              let actor = await Actor.findOne({ $or: [{ name }, { slug }] }).session(session)
              if (!actor) {
                  actor = (await Actor.create([{ name, slug }], { session }))[0]
              }
              actorIds.push(actor._id)
          }
      }

      const videoData = {
        title,
        description: description || "",
        videoUrl,
        thumbnailUrl: thumbnailUrl || `https://picsum.photos/seed/${Math.random()}/640/360`,
        uploader: user.userId,
        channel: channel._id,
        category: categoryId || null,
        tags: Array.isArray(tags) ? tags : [],
        actors: actorIds,
        visibility: visibility || "public",
        status: "approved", // Link-based videos are auto-approved for simplicity
        uploadId: idempotencyKey,
        isShort: !!isShort,
        channelName: channel.name,
        channelAvatar: channel.logo || ""
      };

      const videoResult = await Video.findOneAndUpdate(
        { uploadId: idempotencyKey },
        { $setOnInsert: videoData },
        { upsert: true, new: true, includeResultMetadata: true, session }
      );

      if (!videoResult.lastErrorObject?.updatedExisting) {
        if (categoryId) {
          await Category.findByIdAndUpdate(categoryId, { $inc: { videoCount: 1 } }, { session });
        }
        await Channel.findByIdAndUpdate(channel._id, { $inc: { videoCount: 1 } }, { session });
      }

      return videoResult.value;
    });

    // 🚀 ASYNC NOTIFICATION FAN-OUT (In-App + Email)
    if (result) {
        (async () => {
            try {
                const { Subscription } = await import("@/lib/models/Interaction")
                const NotificationModel = (await import("@/lib/models/Notification")).default
                const { sendNotificationEmail } = await import("@/lib/mail")
                
                // Fetch subscribers with their emails
                const subscribers = await Subscription.find({ channel: result.channel })
                  .populate("subscriber", "email username")
                  .lean()
                
                if (subscribers?.length > 0) {
                    // 1. Send In-App Notifications
                    await NotificationModel.insertMany(
                        subscribers.map((s: any) => ({
                            recipient: s.subscriber._id || s.subscriber,
                            actor: result.channel,
                            video: result._id,
                            type: "upload",
                            meta: { title: result.title, thumbnail: result.thumbnailUrl, channelName: result.channelName }
                        })),
                        { ordered: false }
                    ).catch(e => console.error("In-app notification batch failed:", e))

                    // 2. Send Email Notifications
                    const videoUrl = `${CONFIG.APP_URL}/watch/${result._id}`
                    
                    // We do this in parallel but limit concurrency if needed. For now, Promise.all is fine for smaller sub counts.
                    Promise.all(subscribers.map(async (s: any) => {
                      if (s.subscriber?.email) {
                        return sendNotificationEmail({
                          to: s.subscriber.email,
                          subject: `New video from ${result.channelName || "Channel"}: ${result.title || "Video"}`,
                          channelName: result.channelName || "Channel",
                          videoTitle: result.title || "New Video",
                          videoUrl: videoUrl,
                          thumbnailUrl: result.thumbnailUrl
                        })
                      }
                    })).catch(e => console.error("Email notification batch failed:", e))
                }
            } catch (e) { console.error("Fan-out failed:", e); }
        })()
    }
    
    return ApiResponse.success(result, "Video created successfully", 201);
  } catch (error: any) {
    return ApiResponse.error(error.message);
  }
}
