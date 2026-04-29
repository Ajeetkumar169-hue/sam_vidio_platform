import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const session = await getCurrentUser();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { username, avatar, addGalleryImage, removeGalleryImage } = await req.json();

        // 1. Validation & Pre-checks
        if (username && (username.length < 3 || username.length > 20)) {
            return NextResponse.json({ error: "Username must be 3-20 characters" }, { status: 400 });
        }

        if (username) {
            const existing = await User.findOne({ username, _id: { $ne: session.userId } });
            if (existing) {
                return NextResponse.json({ error: "Username already taken" }, { status: 400 });
            }
        }

        // 2. Build Update Operations
        const updateOps: any = { $set: {} };

        if (username) updateOps.$set.username = username;
        
        if (avatar) {
            updateOps.$set.avatar = avatar;
            // Clean unshift: Remove if exists, then push to position 0
            await User.findByIdAndUpdate(session.userId, { 
                $pull: { galleryImages: avatar } 
            });
            updateOps.$push = { 
                galleryImages: { $each: [avatar], $position: 0 } 
            };
        }

        if (addGalleryImage) {
            // Also handle explicit additions with unshift
            await User.findByIdAndUpdate(session.userId, { 
                $pull: { galleryImages: addGalleryImage } 
            });
            if (!updateOps.$push) updateOps.$push = {};
            updateOps.$push.galleryImages = { $each: [addGalleryImage], $position: 0 };
        }

        if (removeGalleryImage) {
            updateOps.$pull = { galleryImages: removeGalleryImage };
        }

        // 3. Execute Update
        let updatedUser = await User.findByIdAndUpdate(
            session.userId,
            updateOps,
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // 4. Storage Control: Cap gallery at 10 items
        if (updatedUser.galleryImages && updatedUser.galleryImages.length > 10) {
            updatedUser.galleryImages = updatedUser.galleryImages.slice(0, 10);
            await updatedUser.save();
        }

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                username: updatedUser.username,
                avatar: updatedUser.avatar,
                galleryImages: updatedUser.galleryImages || []
            }
        });

    } catch (error: any) {
        console.error("❌ Profile Update Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
