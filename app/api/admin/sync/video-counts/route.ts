import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Video from "@/lib/models/Video"
import Category from "@/lib/models/Category"
import Channel from "@/lib/models/Channel"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const user = await getCurrentUser()
    
    // Strict Admin Protection
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    const syncStartTime = new Date()
    console.log(`🚀 [SYNC] Starting elite video count synchronization at ${syncStartTime.toISOString()}`)

    // 1. Reset ALL counts to zero first (Removes ghost/orphaned counts)
    await Category.updateMany({}, { $set: { videoCount: 0 } })
    await Channel.updateMany({}, { $set: { videoCount: 0 } })

    // 2. Aggregate counts per Category
    // Race protection: only count videos created before sync started
    const categoryCounts = await Video.aggregate([
      { 
        $match: { 
          category: { $ne: null },
          isDeleted: { $ne: true },
          createdAt: { $lt: syncStartTime }
        } 
      },
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 } 
        } 
      }
    ])

    // 3. Aggregate counts per Channel
    const channelCounts = await Video.aggregate([
      { 
        $match: { 
          channel: { $ne: null },
          isDeleted: { $ne: true },
          createdAt: { $lt: syncStartTime }
        } 
      },
      { 
        $group: { 
          _id: "$channel", 
          count: { $sum: 1 } 
        } 
      }
    ])

    // 4. Perform Bulk Updates for Categories
    if (categoryCounts.length > 0) {
      const categoryOps = categoryCounts.map(item => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { videoCount: item.count } }
        }
      }))
      await Category.bulkWrite(categoryOps)
    }

    // 5. Perform Bulk Updates for Channels
    if (channelCounts.length > 0) {
      const channelOps = channelCounts.map(item => ({
        updateOne: {
          filter: { _id: item._id },
          update: { $set: { videoCount: item.count } }
        }
      }))
      await Channel.bulkWrite(channelOps)
    }

    const totalVideos = await Video.countDocuments({ isDeleted: { $ne: true }, createdAt: { $lt: syncStartTime } })

    // Audit Logging
    console.log({
      action: "SYNC_VIDEO_COUNTS",
      admin: user.username,
      timestamp: syncStartTime,
      results: {
        categories: categoryCounts.length,
        channels: channelCounts.length,
        totalVideos
      }
    })

    return NextResponse.json({
      success: true,
      message: "Direct counts synchronized successfully",
      stats: {
        categoriesSynced: categoryCounts.length,
        channelsSynced: channelCounts.length,
        totalVideosProcessed: totalVideos
      }
    })
  } catch (error: any) {
    console.error("❌ Sync Error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
