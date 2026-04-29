import mongoose, { Schema, Document, Model } from "mongoose"

export interface IMessage extends Document {
  sender?: mongoose.Types.ObjectId
  content?: string
  messageType: "text" | "image" | "video" | "audio"
  mediaUrl?: string
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for system messages, but generally required for user msgs
    },
    content: {
      type: String,
      default: "",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio"],
      default: "text",
    },
    mediaUrl: {
      type: String,
    },
  },
  { timestamps: true }
)

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema)
export default Message
