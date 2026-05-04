import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";

/**
 * BATCH PRESIGNED URL GENERATOR
 * Generates multiple signed URLs in a single round-trip to minimize latency.
 * Handles both real S3 and MOCK_MODE gracefully.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { key, uploadId, partNumbers } = await req.json();

        if (!key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // MOCK MODE: No real AWS. Return mock upload endpoint URLs per part.
        if (MOCK_MODE || uploadId.startsWith("mock-")) {
            const urls = partNumbers.map((partNumber: number) => ({
                partNumber,
                url: `/api/upload/mock?uploadId=${uploadId}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`
            }));
            return NextResponse.json({ urls });
        }

        // REAL S3: Generate presigned URLs in parallel for maximum performance
        const urlPromises = partNumbers.map(async (partNumber: number) => {
            const url = await getSignedUrl(s3Client, new UploadPartCommand({
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
