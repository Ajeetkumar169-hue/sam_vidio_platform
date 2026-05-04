import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";

/**
 * BATCH PRESIGNED URL GENERATOR
 * Generates multiple signed URLs in a single round-trip to minimize latency.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { key, uploadId, partNumbers } = await req.json();

        if (!key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Generate signatures in parallel
        const urlPromises = partNumbers.map(async (partNumber: number) => {
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                // Note: For multipart upload, we need special parameters, 
                // but standard PutObject signatures work for individual parts in many S3 configs
                // In production S3, we use UploadPartCommand
            });

            // Using standard S3 Multipart URL generation logic
            const url = await getSignedUrl(s3Client, new (await import("@aws-sdk/client-s3")).UploadPartCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
            }), { expiresIn: 3600 });

            return { partNumber, url };
        });

        const urls = await Promise.all(urlPromises);
        return NextResponse.json({ urls });
    } catch (error: any) {
        console.error("❌ Batch Sign Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
