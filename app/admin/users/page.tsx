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
import { Shield, ShieldAlert, UserX, UserCheck, Search, Trash2, Eye } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1 })
    const [mounted, setMounted] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/users?search=${search}&page=${page}&limit=${limit}`)
            const data = await res.json()
            setUsers(data.users || [])
            if (data.pagination) setPagination(data.pagination)
        } catch (err) {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setPage(1) // Reset to page 1 heavily on search
    }, [search])

    useEffect(() => {
        setMounted(true)
        const timer = setTimeout(fetchUsers, 500)
        return () => clearTimeout(timer)
    }, [search, page, limit])

    const getVisiblePages = (current: number, total: number) => {
        if (total <= 5) return Array.from({length: total}, (_, i) => i + 1)
        if (current <= 3) return [1, 2, 3, 4, 5]
        if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total]
        return [current - 2, current - 1, current, current + 1, current + 2]
    }

    const handleUpdate = async (userId: string, update: any) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, ...update }),
            })
            if (!res.ok) throw new Error()
            toast.success("User updated")
            fetchUsers()
        } catch {
            toast.error("Failed to update user")
        }
    }

    const handleDelete = async (userId: string) => {
        try {
            const res = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            })
            if (!res.ok) throw new Error()
            toast.success("User deleted successfully")
            fetchUsers()
        } catch {
            toast.error("Failed to delete user")
        }
    }

    const calculateAge = (dobString: string) => {
        if (!dobString) return "N/A"
        const dob = new Date(dobString)
        const today = new Date()
        let age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
            age--
        }
        return age
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground">Manage user roles and platform access permissions.</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 w-full sm:max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="border rounded-lg bg-card text-card-foreground overflow-x-auto platinum-scrollbar pb-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading users...</TableCell></TableRow>
                        ) : users.map((user) => (
                            <TableRow key={user._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-9 w-9 overflow-hidden rounded-full bg-primary/10 border border-white/5 flex items-center justify-center font-bold text-primary shadow-inner">
                                            {user.avatar ? (
                                                <img 
                                                    src={user.avatar} 
                                                    alt={user.username} 
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-sm">
                                                    {user.username.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium flex items-center gap-2">
                                                {user.username}
                                                {user.role === "admin" && (
                                                    <Shield className="h-3 w-3 text-primary fill-primary/20" />
                                                )}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={user.role}
                                        onValueChange={(val) => handleUpdate(user._id, { role: val })}
                                    >
                                        <SelectTrigger className="w-[130px] h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">User</SelectItem>
                                            <SelectItem value="moderator">Moderator</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={user.status === "active" ? "default" : "destructive"}>
                                        {user.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-sm">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        {user.status === "active" ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 gap-2"
                                                onClick={() => handleUpdate(user._id, { status: "banned" })}
                                            >
                                                <UserX className="h-4 w-4" />
                                                Ban
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-green-600 gap-2"
                                                onClick={() => handleUpdate(user._id, { status: "active" })}
                                            >
                                                <UserCheck className="h-4 w-4" />
                                                Unban
                                            </Button>
                                        )}
                                        
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary"
                                            onClick={() => {
                                                setSelectedUser(user)
                                                setIsDetailOpen(true)
                                            }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive gap-2 ml-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the user
                                                        <span className="font-bold text-foreground"> @{user.username}</span>, 
                                                        their channel, and all of their uploaded videos from our servers.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        onClick={() => handleDelete(user._id)}
                                                    >
                                                        Yes, Delete Everything
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
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
                            Total: {pagination.total} users
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

            {/* User Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="
                    w-full max-w-none sm:max-w-2xl
                    fixed bottom-0 sm:relative
                    rounded-t-3xl sm:rounded-2xl
                    border-t border-white/10 sm:border-border
                    bg-[#0a0a0f]
                    shadow-[0_-8px_60px_rgba(0,0,0,0.8)]
                    platinum-scrollbar
                    max-h-[92dvh] sm:max-h-[88vh]
                    overflow-y-auto
                    transition-all duration-300
                    p-6
                ">
                    {/* Mobile drag handle */}
                    <div className="flex justify-center -mt-2 mb-3 sm:hidden">
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
                           User Intelligence Profile
                           <Badge variant={selectedUser?.status === "active" ? "default" : "destructive"} className="ml-2 uppercase text-[10px]">
                              {selectedUser?.status}
                           </Badge>
                        </DialogTitle>
                        <DialogDescription className="text-[11px] text-white/40 uppercase tracking-widest">
                            Deep-dive analysis of user security credentials, identity matrix, and system roles.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedUser && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4">
                            {/* Account Section */}
                            <div className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/8">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary/60 border-b border-white/8 pb-2">
                                    Account Foundation
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Username</span>
                                        <span className="text-sm font-bold text-primary">@{selectedUser.username}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Email Address</span>
                                        <span className="text-sm font-medium text-white/80">{selectedUser.email}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Secure Password Hash</span>
                                        <div className="bg-black/40 p-2 rounded-lg border border-white/8 overflow-x-auto">
                                            <span className="text-[10px] font-mono text-primary/80 font-medium break-all whitespace-pre-wrap">
                                                {selectedUser.password || "No hash found"}
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-black text-green-400 uppercase tracking-widest italic">
                                            ✓ Protected by Industry Standard Encryption
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">System ID</span>
                                        <span className="text-[10px] font-mono text-white/40 break-all">{selectedUser._id}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Identity Section */}
                            <div className="space-y-4 bg-white/5 rounded-2xl p-4 border border-white/8">
                                <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-primary/60 border-b border-white/8 pb-2">
                                    Identity Matrix
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Gender</span>
                                        <span className="text-sm font-bold uppercase tracking-tight text-white">{selectedUser.gender || "—"}</span>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Age</span>
                                        <span className="text-sm font-bold text-primary">{calculateAge(selectedUser.dateOfBirth)} yrs</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Contact Number</span>
                                    <span className="text-sm font-black tracking-widest text-white">{selectedUser.phoneNumber || "N/A"}</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">Join Date</span>
                                    <span className="text-xs font-medium text-white/70">{new Date(selectedUser.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[9px] uppercase font-black text-white/30 tracking-wider">System Role</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize border-white/20 text-white/70">{selectedUser.role}</Badge>
                                        {selectedUser.role === "admin" && <Shield className="h-4 w-4 text-primary fill-primary/20" />}
                                    </div>
                                </div>
                                <div className="text-[9px] text-white/20 uppercase font-black tracking-widest pt-2 border-t border-white/5 text-center">
                                    Internal Admin Intelligence Report
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
