import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Report from "@/lib/models/Report"
import { getCurrentUser } from "@/lib/auth"

export async function GET(req: NextRequest) {
    try {
        const session = await getCurrentUser()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await connectDB()
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")

        const query: any = {}
        if (status) query.status = status

        const reports = await Report.find(query)
            .populate("reporter", "username email")
            .sort({ createdAt: -1 })
            .limit(50)

        return NextResponse.json({ reports })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getCurrentUser()
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { reportId, status } = await req.json()
        await connectDB()

        const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true })
        return NextResponse.json({ report })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
