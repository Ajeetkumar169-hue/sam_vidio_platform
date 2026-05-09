"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
    Trash2, 
    Plus, 
    Users, 
    Loader2, 
    ArrowUpDown, 
    Video, 
    ChevronLeft,
    ChevronRight,
    Camera
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Actor {
    _id: string
    name: string
    slug: string
    bio: string
    videoCount: number
    createdAt: string
}

type SortField = 'name' | 'videoCount' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export default function AdminActors() {
    const [actors, setActors] = useState<Actor[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    
    // Pagination & Sorting State
    const [sortField, setSortField] = useState<SortField>('name')
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Form states
    const [newName, setNewName] = useState("")
    const [newBio, setNewBio] = useState("")

    const fetchActors = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/actors")
            const data = await res.json()
            setActors(data.data?.actors || [])
        } catch (err) {
            toast.error("Failed to load actors")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setMounted(true)
        fetchActors()
    }, [])

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const sortedActors = [...actors].sort((a, b) => {
        let comparison = 0
        if (sortField === 'name') {
            comparison = a.name.localeCompare(b.name)
        } else if (sortField === 'videoCount') {
            comparison = (a.videoCount || 0) - (b.videoCount || 0)
        } else if (sortField === 'createdAt') {
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        }
        return sortOrder === 'asc' ? comparison : -comparison
    })

    // Pagination Logic
    const totalPages = Math.ceil(sortedActors.length / rowsPerPage)
    const startIdx = (currentPage - 1) * rowsPerPage
    const paginatedActors = sortedActors.slice(startIdx, startIdx + rowsPerPage)

    // Reset pagination when rowsPerPage changes
    useEffect(() => {
        setCurrentPage(1)
    }, [rowsPerPage])

    const handleAddActor = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName.trim()) return

        setSubmitting(true)
        try {
            const res = await fetch("/api/admin/actors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, bio: newBio }),
            })
            const data = await res.json()
            
            if (!res.ok) throw new Error(data.error || "Failed to create actor")
            
            toast.success("Actor added successfully")
            setNewName("")
            setNewBio("")
            setIsDialogOpen(false)
            fetchActors()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete the actor "${name}"?`)) return
        
        try {
            const res = await fetch(`/api/admin/actors/${id}`, {
                method: "DELETE",
            })
            if (!res.ok) throw new Error("Failed to delete actor")
            
            toast.success("Actor deleted")
            fetchActors()
        } catch {
            toast.error("Failed to delete actor")
        }
    }

    if (!mounted) return null

    return (
        <div className="space-y-4 luxury-easing max-w-7xl mx-auto p-2 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Actor Management</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground italic">Manage performers and actors for your videos.</p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="h-9 gap-1.5 shadow-sm">
                            <Plus className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Add Actor</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-lg">New Actor</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddActor} className="space-y-3 py-2">
                            <div className="space-y-1">
                                <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Name</Label>
                                <Input id="name" placeholder="Actor Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-9 text-sm" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="bio" className="text-[10px] font-bold uppercase text-muted-foreground">Bio / Notes</Label>
                                <Textarea id="bio" placeholder="..." value={newBio} onChange={(e) => setNewBio(e.target.value)} rows={2} className="text-sm resize-none" />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="submit" size="sm" disabled={submitting} className="w-full">
                                    {submitting && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-xl bg-card overflow-x-auto platinum-scrollbar pb-6 shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="h-10 hover:bg-transparent">
                            <TableHead className="text-xs font-bold cursor-pointer hover:bg-muted/80" onClick={() => toggleSort('name')}>
                                <div className="flex items-center gap-1.5">Name <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead className="text-xs font-bold hidden md:table-cell">Slug</TableHead>
                            <TableHead className="text-xs font-bold hidden lg:table-cell">Bio</TableHead>
                            <TableHead className="text-xs font-bold cursor-pointer hover:bg-muted/80" onClick={() => toggleSort('videoCount')}>
                                <div className="flex items-center gap-1.5">Videos <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead className="text-xs font-bold cursor-pointer hover:bg-muted/80 text-right" onClick={() => toggleSort('createdAt')}>
                                <div className="flex items-center justify-end gap-1.5">Added <ArrowUpDown className="h-3 w-3" /></div>
                            </TableHead>
                            <TableHead className="text-right text-xs font-bold px-4">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : actors.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">No actors found.</TableCell></TableRow>
                        ) : paginatedActors.map((actor) => (
                            <TableRow key={actor._id} className="h-11 hover:bg-muted/10 group transition-colors">
                                <TableCell className="font-semibold text-sm py-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Camera className="h-3 w-3 text-primary" />
                                        </div>
                                        {actor.name}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell py-2">
                                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">{actor.slug}</code>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell py-2 max-w-[200px]">
                                    <p className="text-[11px] text-muted-foreground truncate">{actor.bio || "-"}</p>
                                </TableCell>
                                <TableCell className="py-2">
                                    <Badge variant={(actor.videoCount || 0) > 0 ? "secondary" : "outline"} className="text-[10px] px-1.5 h-5 font-bold">
                                        {actor.videoCount || 0}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right text-[11px] text-muted-foreground py-2 font-medium">
                                    {new Date(actor.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                </TableCell>
                                <TableCell className="text-right py-2 px-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        onClick={() => handleDelete(actor._id, actor.name)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {!loading && actors.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2">
                    <div className="flex items-center gap-4">
                        <Select value={String(rowsPerPage)} onValueChange={(val) => setRowsPerPage(Number(val))}>
                            <SelectTrigger className="w-[65px] h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Total: {actors.length}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center px-3 h-8 rounded-md bg-muted/50 border border-white/5">
                            <span className="text-[11px] font-bold">{currentPage} / {totalPages || 1}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
