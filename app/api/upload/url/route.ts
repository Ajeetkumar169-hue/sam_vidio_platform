import { NextRequest, NextResponse } from "next/server";
import { UploadPartCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME, MOCK_MODE } from "@/lib/s3-client";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { key, uploadId, partNumber } = await req.json();

        if (!key || !uploadId || !partNumber) {
            return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
        }

        if (MOCK_MODE) {
            // Return local mock endpoint
            const url = `/api/upload/mock?uploadId=${uploadId}&partNumber=${partNumber}&key=${encodeURIComponent(key)}`;
            return NextResponse.json({ url });
        }

        const command = new UploadPartCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });

        // URL expires in 15 minutes
        const url = await getSignedUrl(s3Client, command, { expiresIn: 900 });

        return NextResponse.json({ url });
    } catch (error: any) {
        console.error("❌ S3 Sign Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
