import { S3Client } from "@aws-sdk/client-s3";
import CONFIG from "./config";

// Detect if S3 is actually configured
export const isS3Configured = !!(
    process.env.AWS_ACCESS_KEY_ID && 
    process.env.AWS_SECRET_ACCESS_KEY && 
    CONFIG.S3.BUCKET &&
    process.env.AWS_ACCESS_KEY_ID !== "your_aws_access_key" &&
    process.env.AWS_ACCESS_KEY_ID !== "mock"
);

// Global MOCK_MODE for S3
export const MOCK_MODE = process.env.MOCK_MODE === "true" || !isS3Configured;

// Transfer Acceleration
export const TRANSFER_ACCELERATION = CONFIG.S3.ACCELERATE && isS3Configured;

const credentials = isS3Configured ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
} : {
    accessKeyId: "mock",
    secretAccessKey: "mock",
};

// Standard S3 client
export const s3Client = new S3Client({
    region: CONFIG.S3.REGION,
    credentials,
});

// Accelerated S3 client
export const s3AccelClient = TRANSFER_ACCELERATION
    ? new S3Client({
        region: CONFIG.S3.REGION,
        credentials,
        useAccelerateEndpoint: true,
    })
    : s3Client;

export const BUCKET_NAME = CONFIG.S3.BUCKET;
