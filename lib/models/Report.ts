import mongoose, { Schema, Document, Model } from "mongoose"

export interface IReport extends Document {
    _id: mongoose.Types.ObjectId
    reporter: mongoose.Types.ObjectId
    targetType: "video" | "user" | "comment"
    targetId: mongoose.Types.ObjectId
    reason: string
    content?: string
    status: "pending" | "resolved" | "dismissed"
    createdAt: Date
    updatedAt: Date
}

const ReportSchema = new Schema<IReport>(
    {
        reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
        targetType: { type: String, enum: ["video", "user", "comment"], required: true },
        targetId: { type: Schema.Types.ObjectId, required: true },
        reason: { type: String, required: true, trim: true },
        content: { type: String },
        status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending" },
    },
    { timestamps: true }
)

ReportSchema.index({ status: 1 })
ReportSchema.index({ createdAt: -1 })

const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema)
export default Report
