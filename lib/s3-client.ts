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

export const s3Client = new S3Client({
    region,
    credentials: isS3Configured ? {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
    } : {
        accessKeyId: "mock",
        secretAccessKey: "mock",
    },
});

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || "mock-bucket";
