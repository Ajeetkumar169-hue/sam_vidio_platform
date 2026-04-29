import mongoose, { Schema, Document, Model } from "mongoose"

// Ensure Category and Channel models are registered if they are used as refs
import "./Category"
import "./Channel"

export interface IVideo {
  _id: mongoose.Types.ObjectId
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  uploader: mongoose.Types.ObjectId
  category?: mongoose.Types.ObjectId
  channel?: mongoose.Types.ObjectId
  tags?: string[]
  views: number
  likes: number
  dislikes: number
  status: "pending" | "approved" | "rejected"
  visibility: "public" | "private" | "unlisted"
  storageSize?: number
  filePublicId?: string
  duration?: number
  uploadId?: string // Idempotency key
  isDeleted?: boolean // Future-proofing
  channelName?: string
  channelAvatar?: string
  createdAt: Date
  updatedAt: Date
}

const VideoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String },
    uploader: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    channel: { type: Schema.Types.ObjectId, ref: "Channel" },
    tags: [{ type: String }],
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    visibility: { type: String, enum: ["public", "private", "unlisted"], default: "public" },
    storageSize: { type: Number, default: 0 },
    filePublicId: { type: String },
    duration: { type: Number },
    uploadId: { type: String, unique: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
    channelName: { type: String },
    channelAvatar: { type: String },
  },
  { timestamps: true }
)

VideoSchema.index({ status: 1, isDeleted: 1, category: 1, createdAt: -1 })
VideoSchema.index({ status: 1, isDeleted: 1, createdAt: -1, _id: -1 }) // Stable sort cursor index
VideoSchema.index({ title: "text", tags: "text" }) // High-speed search index

const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema)
export default Video
