import { NextRequest, NextResponse } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import connectDB from "@/lib/db";
import Video from "@/lib/models/Video";
import Channel from "@/lib/models/Channel";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { key, uploadId, parts, metadata } = await req.json();

        if (!key || !uploadId || !parts || !metadata) {
            return NextResponse.json({ error: "Missing completion data" }, { status: 400 });
        }

        let videoUrl = "";

        if (MOCK_MODE && uploadId.startsWith("mock-")) {
            console.log("📁 [MOCK S3] Completing mock upload for:", uploadId);
            
            const tempDir = path.join(process.cwd(), "public", "uploads", ".temp", uploadId);
            const finalDir = path.join(process.cwd(), "public", "uploads", "videos");
            const fileName = key.split("/").pop(); // Get filename from key (videos/uuid-name)
            
            if (!fs.existsSync(finalDir)) {
                fs.mkdirSync(finalDir, { recursive: true });
            }

            const finalPath = path.join(finalDir, fileName);
            const writeStream = fs.createWriteStream(finalPath);

            // Sort parts by number (though they should already be sorted)
            const sortedParts = parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber);

            for (const part of sortedParts) {
                const partPath = path.join(tempDir, `${part.PartNumber}.part`);
                if (fs.existsSync(partPath)) {
                    const chunk = fs.readFileSync(partPath);
                    writeStream.write(chunk);
                }
            }
            writeStream.end();

            await new Promise((resolve, reject) => {
                writeStream.on("finish", () => resolve(undefined));
                writeStream.on("error", reject);
            });

            // Cleanup temp
            fs.rmSync(tempDir, { recursive: true, force: true });
            
            videoUrl = `/uploads/videos/${fileName}`;
            console.log("✅ [MOCK S3] Video joined and saved at:", videoUrl);
        } else {
            // 1. Complete S3 Multipart session
            const command = new CompleteMultipartUploadCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
                },
            });

            await s3Client.send(command);

            const region = process.env.AWS_REGION || "us-east-1";
            videoUrl = `https://${BUCKET_NAME}.s3.${region}.amazonaws.com/${key}`;
        }

        // 3. Save metadata to MongoDB using a transaction for consistency
        await connectDB();
        
        const result = await (await import("@/lib/db")).runWithRetry(async (session) => {
            let channel = await Channel.findOne({ owner: user.userId }).session(session);
            
            if (!channel) {
                const channelSlug = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-");
                channel = (await Channel.create([{
                    owner: user.userId,
                    name: user.username,
                    slug: channelSlug,
                    subscriberCount: 0,
                    videoCount: 0,
                }], { session }))[0];
            }

            const videoData = {
                title: metadata.title,
                description: metadata.description || "",
                videoUrl: videoUrl,
                thumbnailUrl: metadata.thumbnailUrl || `https://picsum.photos/seed/${Math.random()}/640/360`,
                uploader: user.userId,
                channel: channel._id,
                category: metadata.categoryId || null,
                tags: metadata.tags || [],
                visibility: metadata.visibility || "public",
                status: "processing", // SaaS Level: Trigger Transcoding Pipeline
                processingProgress: 10,
                filePublicId: key,
                storageSize: metadata.fileSize || 0,
                uploadId: uploadId
            };

            // Idempotent creation
            const videoResult = await (await import("@/lib/models/Video")).default.findOneAndUpdate(
                { uploadId: uploadId },
                { $setOnInsert: videoData },
                { upsert: true, new: true, includeResultMetadata: true, session }
            );

            const isNew = !videoResult.lastErrorObject?.updatedExisting;

            if (isNew) {
                // Increment category count
                if (metadata.categoryId) {
                    const Category = (await import("@/lib/models/Category")).default;
                    await Category.findByIdAndUpdate(metadata.categoryId, { $inc: { videoCount: 1 } }, { session });
                }
                // Increment channel count
                await Channel.findByIdAndUpdate(channel._id, { $inc: { videoCount: 1 } }, { session });
                
                console.log(`✅ [TRANS] Multipart finalized and counters incremented: ${videoResult.value?._id}`);
            }

            return videoResult.value;
        });

        // 🎬 SaaS Upgrade: Trigger Mock Transcoding Pipeline
        if (result && result._id) {
            const { simulateTranscoding } = await import("@/lib/transcoder");
            simulateTranscoding(result._id.toString());
        }

        return NextResponse.json({ success: true, video: result });
    } catch (error: any) {
        console.error("❌ S3 Completion Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
