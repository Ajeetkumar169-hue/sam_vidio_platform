import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import Channel from "@/lib/models/Channel"
import Category from "@/lib/models/Category"
import { getCurrentUser } from "@/lib/auth"
import { uploadVideo } from "@/lib/cloudinary"

export const dynamic = 'force-dynamic'
export const revalidate = 60

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export async function GET(req: NextRequest) {
  try {
    await connectDB()
    const { searchParams } = new URL(req.url)
    const sort = searchParams.get("sort") || "latest"
    const category = searchParams.get("category")
    const channel = searchParams.get("channel")
    const featured = searchParams.get("featured")
    const limit = parseInt(searchParams.get("limit") || "20")
    const search = searchParams.get("search")

    const query: any = { 
      status: "approved", 
      isDeleted: { $ne: true } 
    }
    if (category) query.category = category
    if (channel) query.channel = channel
    if (featured === "true") query.isFeatured = true
    
    // Stable Cursor Pagination
    const lastId = searchParams.get("lastId")
    const lastCreatedAt = searchParams.get("lastCreatedAt")
    
    if (lastCreatedAt && lastId) {
      query.$or = [
        { createdAt: { $lt: new Date(lastCreatedAt) } },
        {
          createdAt: new Date(lastCreatedAt),
          _id: { $lt: lastId }
        }
      ]
    }

    if (search) {
      // Use text search index if available, fallback to regex for partial matches
      query.$text = { $search: search }
    }

    let sortOptions: any = { createdAt: -1, _id: -1 }
    if (sort === "trending" || sort === "popular") sortOptions = { views: -1, _id: -1 }
    else if (sort === "top-rated") sortOptions = { likes: -1, _id: -1 }

    const videos = await Video.find(query)
      .sort(sortOptions)
      .limit(limit)
      .select("title thumbnailUrl videoUrl views likes channel category uploader createdAt duration channelName channelAvatar")
      .populate("channel", "name slug logo")
      .lean({ virtuals: false })
      .maxTimeMS(2000)

    return NextResponse.json({
      success: true,
      videos,
      nextCursor: videos.length === limit ? {
        lastId: videos[videos.length - 1]._id,
        lastCreatedAt: videos[videos.length - 1].createdAt
      } : null
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120"
      }
    })
  } catch (error: any) {
    console.error("Videos fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch videos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || ""
    let title: string = ""
    let description: string = ""
    let url: string = ""
    let categoryId: string = ""
    let thumbnailUrl: string = ""
    let visibility: string = "public"
    let tags: string[] = []
    let file: File | null = null

    // Parse body immediately to avoid stream interruption
    try {
      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData()
        title = formData.get("title") as string
        description = (formData.get("description") as string) || ""
        categoryId = formData.get("categoryId") as string
        thumbnailUrl = (formData.get("thumbnailUrl") as string) || ""
        visibility = (formData.get("visibility") as string) || "public"
        const tagsParam = formData.get("tags") as string
        tags = tagsParam ? tagsParam.split(",").map(t => t.trim()).filter(Boolean) : []
        file = formData.get("file") as File | null
        const linkUrl = formData.get("videoUrl") as string
        if (linkUrl && (!file || file.size === 0)) url = linkUrl
        
        // Handle direct file upload to Cloudinary if MOCK_MODE is false
        if (file && file.size > 0) {
           console.log(`☁️ Uploading file to Cloudinary: ${file.name} (${file.size} bytes)`);
           const buffer = Buffer.from(await file.arrayBuffer());
           const uploadResult = await uploadVideo(buffer);
           url = uploadResult.secure_url;
           console.log("✅ Cloudinary upload successful:", url);
        }
      } else {
        const body = await req.json()
        title = body.title
        description = body.description || ""
        url = body.videoUrl || body.url
        categoryId = body.categoryId
        thumbnailUrl = body.thumbnailUrl || ""
        visibility = body.visibility || "public"
        tags = Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [])
      }
    } catch (parseError: any) {
      console.error("❌ Body Parsing Error:", parseError)
      return NextResponse.json({ 
        success: false, 
        error: `Failed to parse request: ${parseError.message || "Invalid body format"}` 
      }, { status: 400 })
    }

    // Now perform DB connection and Auth
    await connectDB()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Generate a temporary uploadId if not provided (for Link flow)
    const idempotencyKey = url || title + user.userId;

    const result = await (await import("@/lib/db")).runWithRetry(async (session) => {
      let channel = await Channel.findOne({ owner: user.userId }).session(session)
      
      // Create channel if missing
      if (!channel) {
        const channelSlug = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-")
        channel = (await Channel.create([{
          owner: user.userId,
          name: user.username,
          slug: channelSlug,
          description: `Welcome to ${user.username}'s channel!`,
          logo: "",
          banner: "",
          subscriberCount: 0,
          videoCount: 0,
        }], { session }))[0]
      }
      
      // Idempotent creation
      const videoData = {
        title,
        description,
        videoUrl: url,
        thumbnailUrl: thumbnailUrl || `https://picsum.photos/seed/${Math.random()}/640/360`,
        uploader: user.userId,
        channel: channel._id,
        category: categoryId || null,
        tags,
        visibility,
        status: "approved",
        uploadId: idempotencyKey,
        channelName: channel.name,
        channelAvatar: channel.logo || ""
      };

      // Raw result to detect if it's a new document
      const videoResult = await Video.findOneAndUpdate(
        { uploadId: idempotencyKey },
        { $setOnInsert: videoData },
        { upsert: true, new: true, includeResultMetadata: true, session }
      );

      const isNew = !videoResult.lastErrorObject?.updatedExisting;

      if (isNew) {
        // Increment category count
        if (categoryId) {
          await Category.findByIdAndUpdate(categoryId, { $inc: { videoCount: 1 } }, { session });
        }
        // Increment channel count
        await Channel.findByIdAndUpdate(channel._id, { $inc: { videoCount: 1 } }, { session });
        
        console.log(`✅ [TRANS] New video created and counters incremented: ${videoResult.value?._id}`);
      }

      return videoResult.value;
    });

    if (!result) {
      throw new Error("Failed to create/find video");
    }

    // 🔥 TIER-1 NOTIFICATION FAN-OUT (Async, outside transaction)
    try {
      const { Subscription } = await import("@/lib/models/Interaction")
      const NotificationModel = (await import("@/lib/models/Notification")).default
      
      const channel = await Channel.findById(result.channel);
      const subscribers = await Subscription.find({ channel: result.channel })
        .select("subscriber")
        .lean()

      if (subscribers && subscribers.length > 0) {
        const BATCH_SIZE = 100
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
          const batch = subscribers.slice(i, i + BATCH_SIZE)
          try {
            await NotificationModel.insertMany(
              batch.map((s: any) => ({
                recipient: s.subscriber,
                actor: channel?._id,
                video: result._id,
                type: "upload",
                meta: {
                  title: result.title,
                  thumbnail: result.thumbnailUrl,
                  channelName: channel?.name
                }
              })),
              { ordered: false }
            )
          } catch (batchErr) {
            console.error("Batch notification error:", batchErr)
          }
        }
      }
    } catch (notifErr: any) {
      console.error("❌ Notification Fan-out Error:", notifErr)
    }
    
    return NextResponse.json({ success: true, video: result }, { status: 201 })
  } catch (error: any) {
    console.error("❌ API Route Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: error.toString()
    }, { status: 500 })
  }
}
