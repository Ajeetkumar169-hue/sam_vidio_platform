import { NextRequest } from "next/server";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UploadPartCommand, ListPartsCommand } from "@aws-sdk/client-s3";
import { s3AccelClient, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";
import { ApiResponse } from "@/lib/api-response";

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
            return ApiResponse.badRequest("Missing uploadId or key");
        }

        if (check === "true") {
            if (MOCK_MODE || uploadId.startsWith("mock-")) {
                return ApiResponse.success(null, "Session alive (Mock)");
            }

            try {
                await s3AccelClient.send(new ListPartsCommand({
                    Bucket: BUCKET_NAME,
                    Key: key,
                    UploadId: uploadId,
                    MaxParts: 1
                }));
                return ApiResponse.success(null, "Session alive");
            } catch (e: any) {
                if (e.name === "NoSuchUpload") {
                    return ApiResponse.notFound("Upload session expired or not found");
                }
                return ApiResponse.error(e.message);
            }
        }

        return ApiResponse.badRequest("Invalid query parameter 'check'");
    } catch (error: any) {
        return ApiResponse.error(error.message);
    }
}

/**
 * BATCH PRESIGNED URL GENERATOR (POST)
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return ApiResponse.unauthorized();

        const { key, uploadId, partNumbers } = await req.json();

        if (!key || !uploadId || !partNumbers || !Array.isArray(partNumbers)) {
            return ApiResponse.badRequest("Invalid or missing parameters");
        }

        if (MOCK_MODE || uploadId.startsWith("mock-")) {
            const urls = partNumbers.map((partNumber: number) => ({
                partNumber,
                url: `/api/upload/mock?uploadId=${uploadId}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`
            }));
            return ApiResponse.success({ urls });
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
        return ApiResponse.success({ urls }, "Batch presigned URLs generated");
    } catch (error: any) {
        return ApiResponse.error(error.message, 500, error);
    }
}
