/**
 * 🛠️ CENTRALIZED CONFIGURATION SYSTEM
 * Standardizes environment variables and platform-wide settings.
 */

export const CONFIG = {
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "VidStream Pro",
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    
    // Auth
    JWT_SECRET: process.env.JWT_SECRET || "default_secret_for_dev_only",
    
    // Storage (S3/R2)
    S3: {
        REGION: process.env.AWS_REGION || "us-east-1",
        BUCKET: process.env.AWS_BUCKET_NAME || "vidstream-uploads",
        ACCELERATE: process.env.S3_TRANSFER_ACCELERATION === "true",
    },

    // Transcoding
    TRANSCODER: {
        CONCURRENCY: parseInt(process.env.TRANSCODE_CONCURRENCY || "2"),
        MOCK: process.env.MOCK_TRANSCODE === "true" || process.env.NODE_ENV === "development",
    },

    // Performance
    UPLOAD: {
        CHUNK_SIZE: 16 * 1024 * 1024, // 16MB Base
        MAX_WORKERS: 12,
    },

    // Database
    MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/vidstream",
};

export default CONFIG;
