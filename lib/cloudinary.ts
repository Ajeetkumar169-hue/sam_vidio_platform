import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

// 1. Validation & Mode Detection
const {
  CLOUDINARY_CLOUD_NAME: name,
  CLOUDINARY_API_KEY: key,
  CLOUDINARY_API_SECRET: secret,
  MOCK_MODE: mockModeEnv
} = process.env;

// Detect MOCK_MODE: True if explicitly set OR if keys are placeholders/missing
export const MOCK_MODE = 
  mockModeEnv === "true" || 
  !key || 
  key === "your_actual_api_key" || 
  key.includes("your_real");

if (MOCK_MODE) {
  console.log("📁 [MOCK MODE] Local file storage enabled (public/uploads)");
} else {
  // Configuration for real Cloudinary
  cloudinary.config({
    cloud_name: name,
    api_key: key,
    api_secret: secret,
    secure: true,
  });
}

/**
 * Utility function to upload a file (as Buffer) to Cloudinary or Local Storage
 */
const uploadToCloudinary = async (
  buffer: Buffer,
  folder: string,
  resourceType: "auto" | "image" | "video" = "auto"
): Promise<{ secure_url: string; public_id: string }> => {
  
  if (MOCK_MODE) {
    // Generate a unique filename
    const ext = resourceType === "video" ? "mp4" : "png";
    const fileName = `${Date.now()}-${randomUUID()}.${ext}`;
    const publicUploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure directory exists
    if (!fs.existsSync(publicUploadDir)) {
      fs.mkdirSync(publicUploadDir, { recursive: true });
    }
    
    const uploadPath = path.join(publicUploadDir, fileName);
    fs.writeFileSync(uploadPath, buffer);
    
    const localUrl = `/uploads/${fileName}`;
    console.log(`📁 [MOCK] ${resourceType} saved locally: ${localUrl}`);
    
    return {
      secure_url: localUrl,
      public_id: fileName,
    };
  }

  // Real Cloudinary Upload logic
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: folder,
        ...(resourceType === "image" ? {
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" }
          ]
        } : {})
      },
      (error, result) => {
        if (error) {
          console.error(`❌ Cloudinary Upload Error [${resourceType}]:`, error);
          return reject(new Error(error.message));
        }
        if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error("Cloudinary upload failed: No result returned"));
        }
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Helper to upload a video
 */
export const uploadVideo = async (buffer: Buffer, folder: string = "videos") => {
  return uploadToCloudinary(buffer, folder, "video");
};
/**
 * Unified asset deletion (Handles Cloudinary and Mock Mode)
 */
export const deleteAsset = async (
  publicId: string, 
  resourceType: "image" | "video" = "image"
): Promise<any> => {
  if (MOCK_MODE) {
    try {
      const publicUploadDir = path.join(process.cwd(), "public", "uploads");
      const filePath = path.join(publicUploadDir, publicId);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`📁 [MOCK] Deleted local file: ${publicId}`);
      }
      return { result: "ok" };
    } catch (err) {
      console.error("📁 [MOCK] Local file deletion failed:", err);
      // Don't throw to prevent blocking the DB transaction if file is already gone
      return { result: "not found" };
    }
  }

  // Real Cloudinary logic
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        console.error(`❌ Cloudinary Delete Error [${resourceType}]:`, error);
        resolve({ error }); // Resolve instead of reject to avoid crashing transactions
      } else {
        resolve(result);
      }
    });
  });
};

export const deleteImage = async (publicId: string): Promise<any> => {
  return deleteAsset(publicId, "image");
}

/**
 * Helper to upload an image
 */
export const uploadImage = async (buffer: Buffer, folder: string = "images") => {
  return uploadToCloudinary(buffer, folder, "image");
};

export default cloudinary;
