"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
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
import { CheckCircle2, XCircle, AlertTriangle, UserCircle, Film, MessageSquare } from "lucide-react"

export default function AdminReports() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("pending")

    const fetchReports = () => {
        setLoading(true)
        fetch(`/api/admin/reports?status=${filter}`)
            .then(res => res.json())
            .then(data => {
                setReports(data.reports || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchReports()
    }, [filter])

    const handleResolve = async (reportId: string, status: string) => {
        try {
            const res = await fetch("/api/admin/reports", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reportId, status }),
            })
            if (!res.ok) throw new Error()
            toast.success(`Report ${status}`)
            fetchReports()
        } catch {
            toast.error("Failed to update report")
        }
    }

    const getTargetIcon = (type: string) => {
        switch (type) {
            case "video": return <Film className="w-4 h-4" />
            case "user": return <UserCircle className="w-4 h-4" />
            case "comment": return <MessageSquare className="w-4 h-4" />
            default: return <AlertTriangle className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">System Reports</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Handle user flaggings and content moderation reports.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                    <Button variant={filter === "pending" ? "default" : "outline"} size="sm" onClick={() => setFilter("pending")}>Pending</Button>
                    <Button variant={filter === "resolved" ? "default" : "outline"} size="sm" onClick={() => setFilter("resolved")}>Resolved</Button>
                    <Button variant={filter === "dismissed" ? "default" : "outline"} size="sm" onClick={() => setFilter("dismissed")}>Dismissed</Button>
                </div>
            </div>

            <div className="border rounded-lg bg-card overflow-x-auto platinum-scrollbar">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Target</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8">Loading reports...</TableCell></TableRow>
                        ) : reports.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No reports found.</TableCell></TableRow>
                        ) : reports.map((report) => (
                            <TableRow key={report._id}>
                                <TableCell className="font-mono text-xs">{report.targetId}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {getTargetIcon(report.targetType)}
                                        <span className="capitalize">{report.targetType}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium">{report.reporter?.username || "Guest"}</p>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm border-l-2 border-primary/20 pl-2 italic">{report.reason}</p>
                                </TableCell>
                                <TableCell className="text-xs">
                                    {new Date(report.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    {report.status === "pending" && (
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-600 gap-2"
                                                onClick={() => handleResolve(report._id, "resolved")}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Resolve
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-400 gap-2"
                                                onClick={() => handleResolve(report._id, "dismissed")}
                                            >
                                                <XCircle className="h-4 w-4" />
                                                Dismiss
                                            </Button>
                                        </div>
                                    )}
                                    {report.status !== "pending" && (
                                        <Badge variant="outline">{report.status}</Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
