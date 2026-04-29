"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Trash2, CheckCircle, XCircle, ExternalLink, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AdminVideos() {
    const [videos, setVideos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("pending")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
    const [mounted, setMounted] = useState(false)

    const fetchVideos = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/videos?status=${statusFilter}&page=${page}&limit=${limit}`)
            const data = await res.json()
            setVideos(data.videos || [])
            if (data.pagination) setPagination(data.pagination)
        } catch (err) {
            toast.error("Failed to load videos")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1) // Reset page on status change
    }, [statusFilter])

    useEffect(() => {
        setMounted(true)
        fetchVideos()
    }, [statusFilter, page, limit])

    const getVisiblePages = (current: number, total: number) => {
        if (total <= 5) return Array.from({length: total}, (_, i) => i + 1)
        if (current <= 3) return [1, 2, 3, 4, 5]
        if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total]
        return [current - 2, current - 1, current, current + 1, current + 2]
    }

    const handleUpdateStatus = async (videoId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/videos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId, status }),
            })
            if (!res.ok) throw new Error()
            toast.success(`Video ${status} successfully`)
            fetchVideos()
        } catch {
            toast.error("Failed to update status")
        }
    }

    const handleDelete = async (videoId: string) => {
        if (!confirm("Are you sure you want to delete this video? This will also remove it from Cloudinary.")) return
        try {
            const res = await fetch("/api/admin/videos", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId }),
            })
            if (!res.ok) throw new Error()
            toast.success("Video deleted")
            fetchVideos()
        } catch {
            toast.error("Failed to delete video")
        }
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Management</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground">Approve, reject, or remove platform content.</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    <Button
                        variant={statusFilter === "pending" ? "default" : "outline"}
                        onClick={() => setStatusFilter("pending")}
                        size="sm"
                    >
                        Pending
                    </Button>
                    <Button
                        variant={statusFilter === "approved" ? "default" : "outline"}
                        onClick={() => setStatusFilter("approved")}
                        size="sm"
                    >
                        Approved
                    </Button>
                    <Button
                        variant={statusFilter === "rejected" ? "default" : "outline"}
                        onClick={() => setStatusFilter("rejected")}
                        size="sm"
                    >
                        Rejected
                    </Button>
                    <Button
                        variant={statusFilter === "high-dislikes" ? "destructive" : "outline"}
                        onClick={() => setStatusFilter("high-dislikes")}
                        size="sm"
                        className={statusFilter === "high-dislikes" ? "" : "text-destructive border-destructive/20 hover:bg-destructive/10"}
                    >
                        Highly Disliked
                    </Button>
                </div>
            </div>

            <div className="border rounded-lg bg-card overflow-x-auto platinum-scrollbar pb-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Video</TableHead>
                            <TableHead>Uploader</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading videos...</TableCell></TableRow>
                        ) : videos.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No videos found.</TableCell></TableRow>
                        ) : videos.map((video) => (
                            <TableRow key={video._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={video.thumbnailUrl}
                                            alt=""
                                            className="w-16 h-10 object-cover rounded bg-muted"
                                        />
                                        <div className="w-48">
                                            <p className="font-medium truncate">{video.title}</p>
                                            <p className="text-xs text-muted-foreground">{new Date(video.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium">{video.uploader?.username}</p>
                                    <p className="text-xs text-muted-foreground">{video.uploader?.email}</p>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="secondary">{video.category?.name}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1 text-xs">
                                        <span className="text-green-500 font-bold">Likes: {video.likes || 0}</span>
                                        <span className={`font-bold ${(video.dislikes || 0) > 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                            Dislikes: -{video.dislikes || 0}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={
                                        video.status === "approved" ? "default" :
                                            video.status === "pending" ? "outline" : "destructive"
                                    }>
                                        {video.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {video.status === "pending" && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600"
                                                    onClick={() => handleUpdateStatus(video._id, "approved")}
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-600"
                                                    onClick={() => handleUpdateStatus(video._id, "rejected")}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={`/watch/${video._id}`} target="_blank">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => handleDelete(video._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            {!loading && pagination.totalPages > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm mt-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground whitespace-nowrap">Rows per page:</span>
                        <Select
                            value={String(limit)}
                            onValueChange={(val) => {
                                setLimit(Number(val))
                                setPage(1)
                            }}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-[70px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-muted-foreground ml-2 whitespace-nowrap">
                            Total: {pagination.total} videos
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center gap-1 mx-2">
                            {getVisiblePages(page, pagination.totalPages).map(p => (
                                <Button
                                    key={p}
                                    variant={p === page ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 w-8 p-0 hidden sm:inline-flex"
                                    onClick={() => setPage(p)}
                                    disabled={loading}
                                >
                                    {p}
                                </Button>
                            ))}
                            <span className="sm:hidden text-muted-foreground">
                                Page <span className="font-medium text-foreground">{page}</span> of {pagination.totalPages}
                            </span>
                        </div>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
