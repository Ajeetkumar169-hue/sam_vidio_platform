import mongoose, { Schema, Document, Model } from "mongoose"

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId
  actor: mongoose.Types.ObjectId
  video?: mongoose.Types.ObjectId
  type: "upload" | "like" | "system"
  read: boolean
  meta?: {
    title?: string
    thumbnail?: string
    channelName?: string
  }
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actor: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video" },
    type: { type: String, enum: ["upload", "like", "system"], default: "upload" },
    read: { type: Boolean, default: false },
    meta: {
      title: String,
      thumbnail: String,
      channelName: String,
    },
  },
  { timestamps: true }
)

// Optimized indexes for unread filtering and feed ordering
NotificationSchema.index({ recipient: 1, createdAt: -1 })
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema)

export default Notification
