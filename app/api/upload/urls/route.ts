export const runtime = 'edge';
import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadPartCommand, ListPartsCommand } from "@aws-sdk/client-s3";
import { s3AccelClient, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";

/**
 * SESSION VALIDATION (GET)
 * Checks if a multipart upload session is still active.
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const uploadId = searchParams.get("uploadId");
        const key = searchParams.get("key");
        const check = searchParams.get("check");

        if (!uploadId || !key) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        if (check === "true") {
            if (MOCK_MODE || uploadId.startsWith("mock-")) {
                // In mock mode, we assume it's alive if the ID is valid format
                return new NextResponse(null, { status: 200 });
            }

            try {
                // Real S3: verify session is still active
                await s3AccelClient.send(new ListPartsCommand({
                    Bucket: BUCKET_NAME,
                    Key: key,
                    UploadId: uploadId,
                    MaxParts: 1
                }));
                return new NextResponse(null, { status: 200 });
            } catch (e: any) {
                if (e.name === "NoSuchUpload") {
                    return new NextResponse(null, { status: 404 });
                }
                return NextResponse.json({ error: e.message }, { status: 500 });
            }
        }

        return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * BATCH PRESIGNED URL GENERATOR (POST)
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { key, uploadId, partNumbers } = await req.json();

        if (!key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        if (MOCK_MODE || uploadId.startsWith("mock-")) {
            const urls = partNumbers.map((partNumber: number) => ({
                partNumber,
                url: `/api/upload/mock?uploadId=${uploadId}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`
            }));
            return NextResponse.json({ urls });
        }

        const urlPromises = partNumbers.map(async (partNumber: number) => {
            const url = await getSignedUrl(s3AccelClient, new UploadPartCommand({
                Bucket: BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
            }), { expiresIn: 86400 });

            return { partNumber, url };
        });

        const urls = await Promise.all(urlPromises);
        return NextResponse.json({ urls });
    } catch (error: any) {
        console.error("❌ Batch Sign Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
