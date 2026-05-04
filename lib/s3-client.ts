import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION || "us-east-1";
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

// Detect if S3 is actually configured or if placeholders are being used
export const isS3Configured = !!(
    accessKeyId && 
    secretAccessKey && 
    process.env.AWS_BUCKET_NAME &&
    accessKeyId !== "your_aws_access_key" &&
    accessKeyId !== "mock"
);

// Global MOCK_MODE for S3: True if explicitly set OR if keys are placeholders/missing
export const MOCK_MODE = process.env.MOCK_MODE === "true" || !isS3Configured;

// Transfer Acceleration: Routes uploads through nearest CloudFront edge
// Enable in AWS Console: S3 Bucket → Properties → Transfer Acceleration → Enable
export const TRANSFER_ACCELERATION = process.env.S3_TRANSFER_ACCELERATION === "true" && isS3Configured;

const credentials = isS3Configured ? {
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
} : {
    accessKeyId: "mock",
    secretAccessKey: "mock",
};

// Standard S3 client (for init, complete, abort operations)
export const s3Client = new S3Client({
    region,
    credentials,
});

// Accelerated S3 client (for presigned URL generation — routes via CloudFront edge)
// When Transfer Acceleration is enabled, presigned URLs use *.s3-accelerate.amazonaws.com
// This means: Browser → nearest CloudFront edge → S3 (instead of direct cross-region hop)
export const s3AccelClient = TRANSFER_ACCELERATION
    ? new S3Client({
        region,
        credentials,
        useAccelerateEndpoint: true,
    })
    : s3Client; // Fallback to standard client if acceleration not enabled

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "mock-bucket";
