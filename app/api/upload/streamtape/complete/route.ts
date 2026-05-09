import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Channel from "@/lib/models/Channel";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiResponse.unauthorized();

    const { fileId, videoUrl, metadata, fileSize } = await req.json();

    if (!videoUrl) {
      return ApiResponse.badRequest("Video URL is missing");
    }

    await connectDB();
    const result = await (await import("@/lib/db")).runWithRetry(async (session) => {
      let channel = await Channel.findOne({ owner: user.userId }).session(session);

      if (!channel) {
        const channelSlug = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-");
        channel = (
          await Channel.create(
            [{ owner: user.userId, name: user.username, slug: channelSlug, subscriberCount: 0, videoCount: 0 }],
            { session }
          )
        )[0];
      }

      const videoData = {
        title: metadata.title || "Untitled Video",
        description: metadata.description || "",
        videoUrl: videoUrl,
        thumbnailUrl: metadata.thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/640/360`,
        uploader: user.userId,
        channel: channel._id,
        category: metadata.categoryId || null,
        tags: metadata.tags || [],
        visibility: metadata.visibility || "public",
        status: "ready",
        processingProgress: 100,
        filePublicId: `streamtape/${fileId || Date.now()}`,
        storageSize: fileSize || 0,
        uploadId: fileId || Date.now().toString(),
        isShort: !!metadata.isShort,
        channelName: channel.name,
        channelAvatar: channel.logo || "",
      };

      const VideoModel = (await import("@/lib/models/Video")).default;
      const video = (await VideoModel.create([videoData], { session }))[0];

      await Channel.findByIdAndUpdate(channel._id, { $inc: { videoCount: 1 } }, { session });

      if (metadata.categoryId) {
        const Category = (await import("@/lib/models/Category")).default;
        await Category.findByIdAndUpdate(metadata.categoryId, { $inc: { videoCount: 1 } }, { session });
      }

      return video;
    });

    return ApiResponse.success({ video: result }, "Video uploaded to Streamtape successfully", 201);
  } catch (error: any) {
    console.error("❌ [STREAMTAPE UPLOAD COMPLETE] Error:", error);
    return ApiResponse.error(error.message, 500, error);
  }
}
