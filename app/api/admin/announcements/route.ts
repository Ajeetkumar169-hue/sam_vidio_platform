import { NextRequest } from "next/server"
import connectDB from "@/lib/db"
import User from "@/lib/models/User"
import Notification from "@/lib/models/Notification"
import { getCurrentUser } from "@/lib/auth"
import { ApiResponse } from "@/lib/api-response"
import { sendNotificationEmail } from "@/lib/mail"
import CONFIG from "@/lib/config"

/**
 * 📢 ADMIN ANNOUNCEMENTS API
 * Sends a platform-wide notification and email to all users.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const currentUser = await getCurrentUser()

    // 1. Verify Admin Authority
    if (!currentUser || currentUser.role !== "admin") {
      return ApiResponse.unauthorized("Only admins can send announcements")
    }

    const { title, content, link } = await req.json()

    if (!title || !content) {
      return ApiResponse.badRequest("Title and content are required")
    }

    // 2. Fetch All Active Users
    const users = await User.find({ status: "active" }).select("_id email username").lean()

    if (!users.length) {
      return ApiResponse.success({ count: 0 }, "No active users found")
    }

    // 3. System-Wide Fan-out (Async)
    (async () => {
      try {
        // A. In-App Notifications (Batch Insert)
        const notifications = users.map((u: any) => ({
          recipient: u._id,
          actor: currentUser.userId, // Admin is the actor
          type: "system",
          meta: {
            title: title,
            channelName: "VidStream Official",
            thumbnail: "/logo.png" // Use system logo
          }
        }))

        // Insert in chunks of 500 to prevent BSON limit issues
        const chunkSize = 500
        for (let i = 0; i < notifications.length; i += chunkSize) {
          await Notification.insertMany(notifications.slice(i, i + chunkSize), { ordered: false })
        }

        // B. Email Notifications
        const announcementUrl = link || CONFIG.APP_URL
        
        // Parallel email sending (with concurrency limit ideally, but simple for now)
        await Promise.allSettled(
          users.map((u: any) => 
            sendNotificationEmail({
              to: u.email,
              subject: `Announcement: ${title}`,
              channelName: "VidStream Official",
              videoTitle: content,
              videoUrl: announcementUrl,
              thumbnailUrl: CONFIG.APP_URL + "/logo.png"
            })
          )
        )

      } catch (err) {
        console.error("Announcement fan-out failed:", err)
      }
    })()

    return ApiResponse.success(
      { userCount: users.length },
      "Announcement triggered successfully for all users"
    )
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
}
