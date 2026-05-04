import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function PUT(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const uploadId = searchParams.get("uploadId");
        const partNumber = searchParams.get("partNumber");

        if (!uploadId || !partNumber) {
            return NextResponse.json({ error: "Missing upload identifier" }, { status: 400 });
        }

        // On Vercel (serverless), filesystem is read-only.
        // We store parts in memory/skip disk write - just ack the chunk.
        const isVercel = !!process.env.VERCEL;

        if (!isVercel) {
            // Local dev: save chunks to disk for real assembly later
            const buffer = Buffer.from(await req.arrayBuffer());
            const tempDir = path.join(process.cwd(), "public", "uploads", ".temp", uploadId);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const partPath = path.join(tempDir, `${partNumber}.part`);
            fs.writeFileSync(partPath, buffer);
            console.log(`✅ PUT chunk ${partNumber} → success (Local)`);
        } else {
            // Vercel: consume the stream to prevent hanging, then ack
            await req.arrayBuffer();
            console.log(`✅ PUT chunk ${partNumber} → success (Vercel)`);
        }

        return new NextResponse(null, {
            status: 200,
            headers: {
                "ETag": `"${Math.random().toString(36).substring(7)}"`,
                "Access-Control-Allow-Origin": "*",
            }
        });
    } catch (error: any) {
        console.error("❌ Mock Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "PUT, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, ETag",
        }
    });
}
