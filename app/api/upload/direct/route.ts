import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/lib/api-response";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import connectDB from "@/lib/db";
import Channel from "@/lib/models/Channel";

export const dynamic = "force-dynamic";

// Allow large video files - up to 500MB
export const maxDuration = 300;

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return ApiResponse.unauthorized();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const metadataRaw = formData.get("metadata") as string | null;

    if (!file) {
      return ApiResponse.badRequest("No video file provided");
    }

    const metadata = metadataRaw ? JSON.parse(metadataRaw) : {};

    // Sanitize filename
    const extension = file.name.split(".").pop() || "mp4";
    const nameWithoutExt = file.name.split(".").slice(0, -1).join(".");
    const sanitizedName = `${slugify(nameWithoutExt)}.${extension}`;
    const finalFilename = `${randomUUID()}-${sanitizedName}`;

    // Save to disk
    const finalDir = path.join(process.cwd(), "public", "uploads", "videos");
    if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

    const finalPath = path.join(finalDir, finalFilename);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(finalPath, Buffer.from(arrayBuffer));

    const videoUrl = `/uploads/videos/${finalFilename}`;
    console.log(`✅ [DIRECT UPLOAD] File saved: ${videoUrl} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // Save to database
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

      const uploadId = `direct-${randomUUID()}`;
      const videoData = {
        title: metadata.title || file.name,
        description: metadata.description || "",
        videoUrl,
        thumbnailUrl: metadata.thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/640/360`,
        uploader: user.userId,
        channel: channel._id,
        category: metadata.categoryId || null,
        tags: metadata.tags || [],
        visibility: metadata.visibility || "public",
        status: "ready",
        processingProgress: 100,
        filePublicId: `videos/${finalFilename}`,
        storageSize: file.size,
        uploadId,
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

    return ApiResponse.success({ video: result }, "Video uploaded successfully", 201);
  } catch (error: any) {
    console.error("❌ [DIRECT UPLOAD] Error:", error);
    return ApiResponse.error(error.message, 500, error);
  }
}
