import { NextRequest } from "next/server";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";
import { ApiResponse } from "@/lib/api-response";
import CONFIG from "@/lib/config";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return ApiResponse.unauthorized();

        const { filename, contentType, fileSize } = await req.json();

        if (!filename || !contentType) {
            return ApiResponse.badRequest("Missing filename or content type");
        }

        // Server-side validation
        const MAX_SIZE = 1024 * 1024 * 1024 * 1024; // 1TB (From business requirement)
        if (fileSize > MAX_SIZE) {
            return ApiResponse.badRequest(`File too large. Max size is 1TB.`);
        }

        const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "application/x-mpegURL"];
        if (!allowedTypes.includes(contentType) && !contentType.startsWith("video/")) {
            return ApiResponse.badRequest("Unsupported video format");
        }

        const key = `videos/${randomUUID()}-${filename}`;

        if (MOCK_MODE) {
            console.log("📁 [MOCK S3] Initializing mock upload for:", filename);
            return ApiResponse.success({
                uploadId: `mock-${randomUUID()}`,
                key: key,
            }, "Mock upload initialized");
        }

        const command = new CreateMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        console.log(`📁 [S3 INIT] Initializing session. Bucket: ${BUCKET_NAME}, Region: ${CONFIG.S3.REGION}`);

        const response = await s3Client.send(command);

        return ApiResponse.success({
            uploadId: response.UploadId,
            key: key,
        }, "Upload session initialized successfully");
        
    } catch (error: any) {
        return ApiResponse.error(error.message, 500, error);
    }
}
