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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Trash2, CheckCircle, XCircle, ExternalLink, Search, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function AdminShorts() {
    const [videos, setVideos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState("pending")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [mounted, setMounted] = useState(false)

    const fetchVideos = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/shorts?status=${statusFilter}&page=${page}&limit=${limit}&search=${search}`)
            const data = await res.json()
            setVideos(data.videos || [])
            if (data.pagination) setPagination(data.pagination)
        } catch (err) {
            toast.error("Failed to load shorts")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1)
        setSelectedIds([])
    }, [statusFilter])

    useEffect(() => {
        setMounted(true)
        fetchVideos()
    }, [statusFilter, page, limit])

    const handleUpdateStatus = async (videoId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/videos", { // We can reuse the same PUT endpoint
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId, status }),
            })
            if (!res.ok) throw new Error()
            toast.success(`Short ${status} successfully`)
            fetchVideos()
        } catch {
            toast.error("Failed to update status")
        }
    }

    const handleDelete = async (videoId: string) => {
        if (!confirm("Are you sure you want to delete this short?")) return
        try {
            const res = await fetch("/api/admin/videos", { // Reuse same DELETE endpoint
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoId }),
            })
            if (!res.ok) throw new Error()
            toast.success("Short deleted")
            fetchVideos()
        } catch {
            toast.error("Failed to delete short")
        }
    }

    const handleBulkStatus = async (status: string) => {
        if (selectedIds.length === 0) return
        try {
            const res = await fetch("/api/admin/videos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoIds: selectedIds, status }),
            })
            if (!res.ok) throw new Error()
            toast.success(`${selectedIds.length} shorts ${status} successfully`)
            setSelectedIds([])
            fetchVideos()
        } catch {
            toast.error(`Failed to ${status} selected shorts`)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} shorts?`)) return
        try {
            const res = await fetch("/api/admin/videos", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ videoIds: selectedIds }),
            })
            if (!res.ok) throw new Error()
            toast.success(`${selectedIds.length} shorts deleted`)
            setSelectedIds([])
            fetchVideos()
        } catch {
            toast.error("Failed to delete selected shorts")
        }
    }

    const toggleSelectAll = () => {
        if (selectedIds.length === videos.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(videos.map(v => v._id))
        }
    }

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Zap className="h-6 w-6 text-orange-500 fill-current" />
                        Shorts Management
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Manage vertical shorts and mobile content.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    <Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")} size="sm">All</Button>
                    <Button variant={statusFilter === "pending" ? "default" : "outline"} onClick={() => setStatusFilter("pending")} size="sm">Pending</Button>
                    <Button variant={statusFilter === "approved" ? "default" : "outline"} onClick={() => setStatusFilter("approved")} size="sm">Approved</Button>
                    <Button variant={statusFilter === "rejected" ? "default" : "outline"} onClick={() => setStatusFilter("rejected")} size="sm">Rejected</Button>
                    <div className="relative flex-1 max-w-sm ml-2">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search shorts..."
                            className="pl-8 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && fetchVideos()}
                        />
                    </div>
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center bg-orange-500/5 p-3 rounded-lg border border-orange-500/20">
                    <span className="text-sm font-medium mr-2">{selectedIds.length} selected</span>
                    <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleBulkStatus("approved")}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleBulkStatus("rejected")}>
                        <XCircle className="h-4 w-4 mr-2" /> Reject
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                </div>
            )}

            <div className="border rounded-lg bg-card overflow-x-auto platinum-scrollbar">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <Checkbox checked={videos.length > 0 && selectedIds.length === videos.length} onCheckedChange={toggleSelectAll} />
                            </TableHead>
                            <TableHead>Short</TableHead>
                            <TableHead>Uploader</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading shorts...</TableCell></TableRow>
                        ) : videos.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No shorts found.</TableCell></TableRow>
                        ) : videos.map((video) => (
                            <TableRow key={video._id} className={selectedIds.includes(video._id) ? "bg-muted/30" : ""}>
                                <TableCell className="text-center">
                                    <Checkbox checked={selectedIds.includes(video._id)} onCheckedChange={() => toggleSelect(video._id)} />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <img src={video.thumbnailUrl} alt="" className="w-10 h-16 object-cover rounded bg-muted border" />
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
                                    <div className="flex flex-col gap-1 text-xs">
                                        <span className="text-green-500 font-bold">Likes: {video.likes || 0}</span>
                                        <span className="text-muted-foreground">Views: {video.views || 0}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={video.status === "approved" ? "default" : video.status === "pending" || video.status === "ready" ? "outline" : "destructive"}>
                                        {video.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {(video.status === "pending" || video.status === "ready") && (
                                            <>
                                                <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleUpdateStatus(video._id, "approved")}><CheckCircle className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleUpdateStatus(video._id, "rejected")}><XCircle className="h-4 w-4" /></Button>
                                            </>
                                        )}
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={`/softporn?id=${video._id}`} target="_blank"><ExternalLink className="h-4 w-4" /></a>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(video._id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
