import { NextRequest, NextResponse } from "next/server";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { key, uploadId } = await req.json();

        if (!key || !uploadId) {
            return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        const command = new AbortMultipartUploadCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
        });

        await s3Client.send(command);

        console.log(`🗑️ S3 Multipart Upload Aborted: ${uploadId}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("❌ S3 Abort Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
