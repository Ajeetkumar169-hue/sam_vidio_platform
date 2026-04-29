import mongoose, { Schema, Document, Model } from "mongoose"

// Like model
export interface ILike extends Document {
  user: mongoose.Types.ObjectId
  video: mongoose.Types.ObjectId
  createdAt: Date
}

const LikeSchema = new Schema<ILike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
  },
  { timestamps: true }
)

LikeSchema.index({ user: 1, video: 1 }, { unique: true })

export const Like: Model<ILike> = mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema)

// Dislike model
export interface IDislike extends Document {
  user: mongoose.Types.ObjectId
  video: mongoose.Types.ObjectId
  createdAt: Date
}

const DislikeSchema = new Schema<IDislike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
  },
  { timestamps: true }
)

DislikeSchema.index({ user: 1, video: 1 }, { unique: true })

export const Dislike: Model<IDislike> = mongoose.models.Dislike || mongoose.model<IDislike>("Dislike", DislikeSchema)

// Subscription model
export interface ISubscription extends Document {
  subscriber: mongoose.Types.ObjectId
  channel: mongoose.Types.ObjectId
  createdAt: Date
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    subscriber: { type: Schema.Types.ObjectId, ref: "User", required: true },
    channel: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
  },
  { timestamps: true }
)

SubscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true })

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription || mongoose.model<ISubscription>("Subscription", SubscriptionSchema)

// Comment Like
export interface ICommentLike extends Document {
  user: mongoose.Types.ObjectId
  comment: mongoose.Types.ObjectId
}

const CommentLikeSchema = new Schema<ICommentLike>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  },
  { timestamps: true }
)

CommentLikeSchema.index({ user: 1, comment: 1 }, { unique: true })

export const CommentLike: Model<ICommentLike> =
  mongoose.models.CommentLike || mongoose.model<ICommentLike>("CommentLike", CommentLikeSchema)

// Watch History
export interface IHistory extends Document {
  user: mongoose.Types.ObjectId
  video: mongoose.Types.ObjectId
  watchedAt: Date
}

const HistorySchema = new Schema<IHistory>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
  },
  { timestamps: true }
)

// Index for fast lookup and sorting
HistorySchema.index({ user: 1, video: 1 })
HistorySchema.index({ user: 1, updatedAt: -1 })

export const History: Model<IHistory> = 
  mongoose.models.History || mongoose.model<IHistory>("History", HistorySchema)
