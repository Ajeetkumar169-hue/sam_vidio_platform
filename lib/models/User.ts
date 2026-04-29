import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUser extends Document {
  username: string
  email: string
  password?: string
  avatar?: string
  galleryImages?: string[]
  role: "user" | "moderator" | "admin"
  status: "active" | "banned"
  dateOfBirth: Date
  phoneNumber: string
  gender: "male" | "female" | "lesbian" | "gay"
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    galleryImages: { type: [String], default: [] },
    role: { type: String, enum: ["user", "moderator", "admin"], default: "user" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    dateOfBirth: { type: Date, required: true },
    phoneNumber: { type: String, required: true },
    gender: { 
      type: String, 
      enum: ["male", "female", "lesbian", "gay"], 
      required: true 
    },
  },
  { timestamps: true }
)

UserSchema.index({ createdAt: -1 })

const User: Model<IUser> = mongoose.models.User || mongoose.model("User", UserSchema)
export default User
