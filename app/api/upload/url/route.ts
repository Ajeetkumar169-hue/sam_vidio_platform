import { ApiResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return ApiResponse.unauthorized();
        }

        const { key, uploadId, partNumber } = await req.json();

        if (!key || !uploadId || !partNumber) {
            return ApiResponse.badRequest("Missing metadata (key, uploadId, or partNumber)");
        }

        if (MOCK_MODE) {
            // Return local mock endpoint
            const url = `/api/upload/mock?uploadId=${uploadId}&partNumber=${partNumber}&key=${encodeURIComponent(key)}`;
            return ApiResponse.success({ url });
        }

        const command = new UploadPartCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });

        // URL expires in 24 hours to prevent failures on slow connections
        const url = await getSignedUrl(s3AccelClient, command, { expiresIn: 86400 });

        return ApiResponse.success({ url });
    } catch (error: any) {
        return ApiResponse.error(error.message, 500, error);
    }
}
