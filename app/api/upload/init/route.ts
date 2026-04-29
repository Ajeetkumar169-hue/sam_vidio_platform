import { NextRequest, NextResponse } from "next/server";
import { CreateMultipartUploadCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename, contentType, fileSize } = await req.json();

        if (!filename || !contentType) {
            return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        // Server-side validation
        const MAX_SIZE = 1024 * 1024 * 1024 * 1024; // 1TB
        if (fileSize > MAX_SIZE) {
            return NextResponse.json({ error: "File too large (Max 1TB)" }, { status: 400 });
        }

        const allowedTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
        if (!allowedTypes.includes(contentType)) {
            return NextResponse.json({ error: "Invalid video format" }, { status: 400 });
        }

        const key = `videos/${randomUUID()}-${filename}`;

        if (MOCK_MODE) {
            console.log("📁 [MOCK S3] Initializing mock upload for:", filename);
            return NextResponse.json({
                uploadId: `mock-${randomUUID()}`,
                key: key,
            });
        }

        const command = new CreateMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const response = await s3Client.send(command);

        return NextResponse.json({
            uploadId: response.UploadId,
            key: key,
        });
    } catch (error: any) {
        console.error("❌ S3 Init Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
