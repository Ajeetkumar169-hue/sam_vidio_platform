import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
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

        // 2. Process File
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 2.1 Binary Validation (Magic Numbers)
        // JPEG starts with FF D8
        // PNG starts with 89 50 4E 47
        const isJPG = buffer[0] === 0xff && buffer[1] === 0xd8;
        const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50;

        if (!isJPG && !isPNG) {
            return NextResponse.json({ error: "Security: Only true JPEG/PNG images are accepted" }, { status: 400 });
        }

        // 3. Upload to Cloudinary (or Local in Mock Mode) with User Scoping
        const result = await uploadImage(buffer, `avatars/${session.userId}`);

        return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error: any) {
        console.error("❌ Image Upload API Error:", error);
        return NextResponse.json({ error: "Upload failed: " + (error.message || "Internal Server Error") }, { status: 500 });
    }
}
