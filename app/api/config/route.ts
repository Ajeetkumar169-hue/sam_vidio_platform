import { ApiResponse } from "@/lib/api-response";

export async function GET() {
    return ApiResponse.success({
        cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || "ml_default", // Default to ml_default if not set
        isMock: process.env.MOCK_MODE === "true"
    });
}
