import { NextRequest, NextResponse } from "next/server";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function POST(req: NextRequest) {
    let uploadedPublicId: string | null = null;
    
    try {
        await connectDB();
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 1. Validation
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Invalid type: Only images (JPG/PNG) allowed" }, { status: 400 });
        }

        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large (Max 2MB)" }, { status: 413 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Binary Validation (Magic Numbers)
        const isJPG = buffer[0] === 0xff && buffer[1] === 0xd8;
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;

        if (!isJPG && !isPNG) {
            return NextResponse.json({ error: "Security: Only true JPEG/PNG images are accepted" }, { status: 400 });
        }

        // 2. Orchestrated Upload
        const uploadResult = await uploadImage(buffer, `avatars/${session.userId}`);
        uploadedPublicId = uploadResult.public_id;
        const imageUrl = uploadResult.secure_url;

        // 3. Atomic DB Update (Consistency + Concurrency Safe)
        const updatedUser = await User.findByIdAndUpdate(
            session.userId,
            {
                $set: { avatar: imageUrl },
                $push: { 
                    galleryImages: { 
                        $each: [imageUrl], 
                        $position: 0,
                        $slice: 10 // Guaranteed Cap
                    } 
                }
            },
            { new: true }
        );

        if (!updatedUser) {
            // Attempt compensation if user not found somehow
            if (uploadedPublicId) await deleteImage(uploadedPublicId);
            return NextResponse.json({ error: "User record not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: "Avatar updated at lightning speed",
            avatar: updatedUser.avatar,
            gallery: updatedUser.galleryImages || []
        });

    } catch (error: any) {
        console.error("❌ High-Speed Avatar API Error:", error);
        
        // 4. Compensation Logic (Rollback)
        if (uploadedPublicId) {
            console.log("🔄 Rolling back Cloudinary upload:", uploadedPublicId);
            try {
                await deleteImage(uploadedPublicId);
            } catch (cleanupErr) {
                console.error("🚨 CRITICAL: Failed to cleanup orphaned asset:", cleanupErr);
            }
        }

        return NextResponse.json({ error: "Update failed: " + (error.message || "Internal Error") }, { status: 500 });
    }
}
