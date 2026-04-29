import mongoose, { Schema, Document, Model } from "mongoose"

export interface IChannel {
  _id: mongoose.Types.ObjectId
  owner: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  logo: string
  banner: string
  subscriberCount: number
  videoCount: number
  createdAt: Date
  updatedAt: Date
}

const ChannelSchema = new Schema<IChannel>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "", maxlength: 500 },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    subscriberCount: { type: Number, default: 0 },
    videoCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const Channel: Model<IChannel> = mongoose.models.Channel || mongoose.model<IChannel>("Channel", ChannelSchema)
export default Channel
