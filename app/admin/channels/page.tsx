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
import { toast } from "sonner"
import { Trash2, Search, ExternalLink, Tv2, Eye, TrendingUp, ThumbsUp, ThumbsDown, PlayCircle, Users, Loader2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function AdminChannels() {
    const [channels, setChannels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [mounted, setMounted] = useState(false)
    const [selectedChannel, setSelectedChannel] = useState<any>(null)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [loadingDetails, setLoadingDetails] = useState(false)

    const fetchChannels = () => {
        setLoading(true)
        fetch(`/api/admin/channels?search=${search}`)
            .then(res => res.json())
            .then(data => {
                setChannels(data.channels || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    useEffect(() => {
        setMounted(true)
        const timer = setTimeout(fetchChannels, 500)
        return () => clearTimeout(timer)
    }, [search])

    const handleDelete = async (channelId: string) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this channel? Click OK to delete the channel ONLY, or cancel to abort."
        )

        if (!confirmDelete) return

        const deleteVideosConf = window.confirm(
            "Do you also want to delete all videos associated with this channel? Click OK to delete videos as well, Cancel to keep them orphaned."
        )

        try {
            const res = await fetch("/api/admin/channels", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ channelId, deleteVideos: deleteVideosConf }),
            })
            if (!res.ok) throw new Error()
            toast.success("Channel deleted successfully")
            fetchChannels()
        } catch {
            toast.error("Failed to delete channel")
        }
    }

    const fetchChannelDetails = async (id: any) => {
        const channelId = typeof id === 'string' ? id : id?.toString();
        if (!channelId) return toast.error("Invalid Channel ID");

        setLoadingDetails(true)
        try {
            console.log("Fetching details for:", channelId); // For debugging
            const res = await fetch(`/api/admin/channels/${channelId}`)
            const data = await res.json()
            
            if (res.ok && data.channel) {
                setSelectedChannel(data.channel)
                setIsDetailOpen(true)
            } else {
                throw new Error(data.error || "Failed to fetch channel intel")
            }
        } catch (error: any) {
            console.error("❌ Detail Fetch Error:", error)
            toast.error(error.message || "Failed to load channel intelligence")
        } finally {
            setLoadingDetails(false)
        }
    }

    if (!mounted) return null

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Channel Management</h1>
                <p className="text-muted-foreground">Monitor and manage all user channels on the platform.</p>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search channels..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="border rounded-lg bg-card text-card-foreground overflow-x-auto platinum-scrollbar pb-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Channel Info</TableHead>
                            <TableHead>Owner</TableHead>
                            <TableHead>Stats</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Loading channels...</TableCell></TableRow>
                        ) : channels.length === 0 ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No channels found.</TableCell></TableRow>
                        ) : channels.map((channel) => (
                            <TableRow key={channel._id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        {channel.logo ? (
                                            <img src={channel.logo} alt="" className="w-10 h-10 rounded-full object-cover bg-muted" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Tv2 className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{channel.name}</p>
                                            <p className="text-xs text-muted-foreground">@{channel.slug}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-medium">{channel.owner?.username}</p>
                                    <p className="text-xs text-muted-foreground">{channel.owner?.email}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <p>{channel.subscriberCount || 0} subs</p>
                                        <p className="text-muted-foreground">{channel.videoCount || 0} videos</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(channel.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={`/channel/${channel.slug}`} target="_blank">
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-primary"
                                            onClick={() => fetchChannelDetails(channel._id)}
                                            disabled={loadingDetails}
                                        >
                                            {loadingDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => handleDelete(channel._id)}
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

            {/* Channel Intelligence Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="
                    w-full max-w-none sm:max-w-3xl
                    fixed bottom-0 sm:relative
                    rounded-t-3xl sm:rounded-2xl
                    border-t border-white/10 sm:border-border
                    bg-[#0a0a0f]
                    shadow-[0_-8px_60px_rgba(0,0,0,0.8)]
                    p-0
                    overflow-y-auto
                    max-h-[92dvh] sm:max-h-[88vh]
                    platinum-scrollbar
                    transition-all duration-300
                ">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Channel Intelligence Details</DialogTitle>
                        <DialogDescription>
                            Comprehensive analytics and performance metrics for the selected channel.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Mobile drag handle */}
                    <div className="flex justify-center pt-3 pb-1 sm:hidden">
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>

                    {!selectedChannel ? (
                        <div className="p-8 text-center text-muted-foreground">Loading channel intelligence...</div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Hero Header */}
                            <div className="relative h-24 sm:h-32 bg-primary/10 overflow-hidden border-b border-white/5">
                                {selectedChannel.banner ? (
                                    <img src={selectedChannel.banner} alt="" className="w-full h-full object-cover opacity-40" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-r from-primary/30 via-purple-900/20 to-primary/30" />
                                )}
                                {/* Neon glow overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/90 to-transparent" />
                                <div className="absolute -bottom-5 left-4 sm:left-6 p-[3px] bg-[#0a0a0f] rounded-full shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                                    {selectedChannel.logo ? (
                                        <img src={selectedChannel.logo} alt="" className="w-14 h-14 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/30" />
                                    ) : (
                                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary border-2 border-primary/30">
                                            <Tv2 className="w-7 h-7 sm:w-10 sm:h-10" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-7 sm:pt-10 px-4 sm:px-8 pb-6 sm:pb-8 space-y-6 sm:space-y-8">
                                {/* Identity & Owner */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                                    <div>
                                        <h2 className="text-lg sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                                            {selectedChannel.name}
                                        </h2>
                                        <p className="text-primary font-bold tracking-widest text-[10px] uppercase opacity-70 mt-0.5">
                                            @{selectedChannel.slug}
                                        </p>
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0 bg-white/5 sm:bg-transparent rounded-xl px-3 py-2 sm:p-0 w-full sm:w-auto">
                                        <span className="text-[9px] uppercase font-black text-white/40 tracking-widest sm:block sm:mb-1">Owner</span>
                                        <div>
                                            <p className="font-bold text-sm text-white sm:text-right">{selectedChannel.owner?.username}</p>
                                            <p className="text-[11px] text-white/50 sm:text-right">{selectedChannel.owner?.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Analytics Grid — 2 col on mobile, 3 on md */}
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/8 space-y-1 col-span-1">
                                        <div className="flex items-center gap-1.5 text-primary">
                                            <Users className="h-3.5 w-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em]">Subscribers</span>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-black text-white">
                                            {selectedChannel.subscriberCount?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/8 space-y-1 col-span-1">
                                        <div className="flex items-center gap-1.5 text-primary">
                                            <PlayCircle className="h-3.5 w-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em]">Videos</span>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-black text-white">
                                            {selectedChannel.videoCount?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/8 space-y-1 col-span-2 md:col-span-1">
                                        <div className="flex items-center gap-1.5 text-green-400">
                                            <TrendingUp className="h-3.5 w-3.5" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.15em]">Total Views</span>
                                        </div>
                                        <p className="text-xl sm:text-2xl font-black text-green-400">
                                            {selectedChannel.totalViews?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Video Intelligence — stacked on mobile */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Most Liked */}
                                    <div className="space-y-2.5">
                                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 border-b border-white/8 pb-2 flex items-center gap-2">
                                            <ThumbsUp className="h-3 w-3 text-primary" /> Most Liked
                                        </h3>
                                        {selectedChannel.analytics?.mostLiked ? (
                                            <div className="flex gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
                                                <img
                                                    src={selectedChannel.analytics.mostLiked.thumbnailUrl}
                                                    alt=""
                                                    className="w-20 h-14 rounded-lg object-cover bg-white/5 flex-shrink-0"
                                                />
                                                <div className="overflow-hidden min-w-0">
                                                    <p className="font-bold text-xs sm:text-sm truncate uppercase tracking-tight text-white">
                                                        {selectedChannel.analytics.mostLiked.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold mt-1.5 flex-wrap">
                                                        <span className="text-primary">{selectedChannel.analytics.mostLiked.likes} Likes</span>
                                                        <span className="text-white/20">|</span>
                                                        <span className="text-white/40">{selectedChannel.analytics.mostLiked.views} Views</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 italic py-3">No engagement data.</p>
                                        )}
                                    </div>

                                    {/* Most Disliked */}
                                    <div className="space-y-2.5">
                                        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-white/40 border-b border-white/8 pb-2 flex items-center gap-2">
                                            <ThumbsDown className="h-3 w-3 text-destructive" /> Most Disliked
                                        </h3>
                                        {selectedChannel.analytics?.mostDisliked ? (
                                            <div className="flex gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/15">
                                                <img
                                                    src={selectedChannel.analytics.mostDisliked.thumbnailUrl}
                                                    alt=""
                                                    className="w-20 h-14 rounded-lg object-cover bg-white/5 flex-shrink-0"
                                                />
                                                <div className="overflow-hidden min-w-0">
                                                    <p className="font-bold text-xs sm:text-sm truncate uppercase tracking-tight text-white">
                                                        {selectedChannel.analytics.mostDisliked.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold mt-1.5 flex-wrap">
                                                        <span className="text-destructive">{selectedChannel.analytics.mostDisliked.dislikes} Dislikes</span>
                                                        <span className="text-white/20">|</span>
                                                        <span className="text-white/40">{selectedChannel.analytics.mostDisliked.views} Views</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 italic py-3">No feedback data.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[9px] text-white/20 uppercase font-black tracking-widest pt-4 border-t border-white/5 text-center">
                                    Internal Admin Intelligence Report • {new Date().toLocaleString()}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
