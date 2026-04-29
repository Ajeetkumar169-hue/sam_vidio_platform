import mongoose, { Schema, Document, Model } from "mongoose"

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId
  video: mongoose.Types.ObjectId
  user: mongoose.Types.ObjectId
  text: string
  parentComment: mongoose.Types.ObjectId | null
  likes: number
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    parentComment: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
)

CommentSchema.index({ video: 1, createdAt: -1 })

const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema)
export default Comment
