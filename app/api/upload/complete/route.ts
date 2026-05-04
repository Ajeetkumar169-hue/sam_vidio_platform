import { NextRequest } from "next/server";
import { CompleteMultipartUploadCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import connectDB from "@/lib/db";
import Channel from "@/lib/models/Channel";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/lib/api-response";
import CONFIG from "@/lib/config";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return ApiResponse.unauthorized();

        const { key, uploadId, parts, metadata } = await req.json();

        if (!key || !uploadId || !parts || !metadata) {
            return ApiResponse.badRequest("Missing completion metadata or parts");
        }

        let videoUrl = "";

        if (MOCK_MODE && uploadId.startsWith("mock-")) {
            console.log("📁 [MOCK S3] Completing mock upload for:", uploadId);
            
            const tempDir = path.join(process.cwd(), "public", "uploads", ".temp", uploadId);
            const finalDir = path.join(process.cwd(), "public", "uploads", "videos");
            const fileName = key.split("/").pop(); 
            
            if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

            const finalPath = path.join(finalDir, fileName);
            const writeStream = fs.createWriteStream(finalPath);
            const sortedParts = parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber);

            for (const part of sortedParts) {
                const partPath = path.join(tempDir, `${part.PartNumber}.part`);
                if (fs.existsSync(partPath)) {
                    writeStream.write(fs.readFileSync(partPath));
                }
            }
            writeStream.end();

            await new Promise((resolve, reject) => {
                writeStream.on("finish", () => resolve(undefined));
                writeStream.on("error", (err) => reject(err));
            });

            fs.rmSync(tempDir, { recursive: true, force: true });
            videoUrl = `/uploads/videos/${fileName}`;
        } else {
            const command = new CompleteMultipartUploadCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
                },
            });

            await s3Client.send(command);
            videoUrl = `https://${BUCKET_NAME}.s3.${CONFIG.S3.REGION}.amazonaws.com/${key}`;
        }

        await connectDB();
        
        const result = await (await import("@/lib/db")).runWithRetry(async (session) => {
            let channel = await Channel.findOne({ owner: user.userId }).session(session);
            
            if (!channel) {
                const channelSlug = user.username.toLowerCase().replace(/[^a-z0-9]/g, "-");
                channel = (await Channel.create([{
                    owner: user.userId,
                    name: user.username,
                    slug: channelSlug,
                    subscriberCount: 0, videoCount: 0,
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
                status: "processing", 
                processingProgress: 10,
                filePublicId: key,
                storageSize: metadata.fileSize || 0,
                uploadId: uploadId
            };

            const VideoModel = (await import("@/lib/models/Video")).default;
            const videoResult = await VideoModel.findOneAndUpdate(
                { uploadId: uploadId },
                { $setOnInsert: videoData },
                { upsert: true, new: true, includeResultMetadata: true, session }
            );

            const isNew = !videoResult.lastErrorObject?.updatedExisting;

            if (isNew) {
                if (metadata.categoryId) {
                    const Category = (await import("@/lib/models/Category")).default;
                    await Category.findByIdAndUpdate(metadata.categoryId, { $inc: { videoCount: 1 } }, { session });
                }
                await Channel.findByIdAndUpdate(channel._id, { $inc: { videoCount: 1 } }, { session });
            }

            return videoResult.value;
        });

        if (result && result._id) {
            const { simulateTranscoding } = await import("@/lib/transcoder");
            simulateTranscoding(result._id.toString());
        }

        return ApiResponse.success({ video: result }, "Video upload finalized and processing started");
    } catch (error: any) {
        return ApiResponse.error(error.message, 500, error);
    }
}
