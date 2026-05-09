import mongoose, { Schema, Document, Model } from "mongoose"

export interface IActor extends Document {
  name: string
  slug: string
  bio?: string
  avatar?: string
  videoCount: number
  createdAt: Date
  updatedAt: Date
}

const ActorSchema = new Schema<IActor>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    bio: { type: String },
    avatar: { type: String },
    videoCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

ActorSchema.index({ name: "text" })

const Actor: Model<IActor> = mongoose.models.Actor || mongoose.model<IActor>("Actor", ActorSchema)
export default Actor
