import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICategory {
  _id: mongoose.Types.ObjectId
  name: string
  slug: string
  description: string
  thumbnail: string
  videoCount: number
  createdAt: Date
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    videoCount: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema)
export default Category
