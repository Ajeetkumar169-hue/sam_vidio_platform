"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { MessageCircle, Loader2, Reply, ThumbsUp } from "lucide-react"

interface Comment {
  _id?: string
  id?: string
  text: string
  likes: number
  createdAt: string
  user: {
    _id?: string
    id?: string
    username: string
    avatar?: string
  }
  parentComment: string | null
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export function CommentsSection({ videoId }: { videoId: string }) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`)
      const data = await res.json()
      setComments(data.comments || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [videoId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setComments((prev) => [data.comment, ...prev])
      setText("")
    } catch {
      toast.error("Failed to post comment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText.trim(), parentComment: parentId }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Reply posted")
      setReplyTo(null)
      setReplyText("")
      loadComments()
    } catch {
      toast.error("Failed to reply")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3">
          <Textarea
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            className="bg-secondary"
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to leave a comment
        </p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => {
            const commentId = comment._id || comment.id || ""
            return (
            <div key={commentId} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                {comment.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mounted ? timeAgo(comment.createdAt) : "• • •"}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.text}</p>
                <div className="mt-1.5 flex items-center gap-3">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="h-3 w-3" />
                    {comment.likes > 0 && comment.likes}
                  </button>
                  {user && (
                    <button
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setReplyTo(replyTo === commentId ? null : commentId)}
                    >
                      <Reply className="h-3 w-3" />
                      Reply
                    </button>
                  )}
                </div>

                {/* Reply Form */}
                {replyTo === commentId && (
                  <div className="mt-2 flex flex-col gap-2">
                    <Textarea
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      className="bg-secondary text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setReplyTo(null)
                          setReplyText("")
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={submitting || !replyText.trim()}
                        onClick={() => handleReply(commentId)}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}
