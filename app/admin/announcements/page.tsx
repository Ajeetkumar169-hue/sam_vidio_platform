"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import { Megaphone, Send, Image as ImageIcon, Loader2, AlertCircle, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AnnouncementsPage() {
    const { user } = useAuth()
    const [message, setMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!message.trim() && !file) {
            toast.error("Please enter a message or attach a file")
            return
        }

        setSending(true)
        const toastId = toast.loading("Broadcasting to all users...")

        try {
            let mediaUrl = ""
            let messageType = "text"

            // 1. Upload file if exists
            if (file) {
                const formData = new FormData()
                formData.append("file", file)
                const upRes = await fetch("/api/chat/upload", {
                    method: "POST",
                    body: formData
                })
                const upData = await upRes.json()
                if (!upRes.ok) throw new Error(upData.error || "Failed to upload media")
                mediaUrl = upData.url
                messageType = upData.type
            }

            // 2. Format the message prominently if it's just text
            // We append a special tag or just uppercase if we want, but letting the admin's badge do the talking is fine.
            const finalContent = message.trim() ? `📢 *ANNOUNCEMENT*: \n\n${message}` : ""

            // 3. Send to Global Chat
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    content: finalContent, 
                    messageType, 
                    mediaUrl 
                })
            })
            
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to send broadcast")

            toast.success("Announcement broadcasted successfully!", { id: toastId })
            setMessage("")
            setFile(null)
            
        } catch (err: any) {
            toast.error(err.message || "Failed to broadcast", { id: toastId })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Megaphone className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Global Announcements</h1>
                    <p className="text-muted-foreground text-sm">Send a message directly to the Global Chat Group</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Broadcast Form */}
                <div className="lg:col-span-2">
                    <div className="bg-card glass-heavy border outline-none border-border rounded-3xl p-6 shadow-xl premium-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                            <Megaphone className="h-40 w-40" />
                        </div>
                        
                        <form onSubmit={handleBroadcast} className="relative z-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold uppercase tracking-widest text-foreground/50 ml-1">Announcement Message</label>
                                <textarea 
                                    className="w-full min-h-[160px] bg-background/50 border border-border rounded-xl p-4 focus:ring-1 ring-primary/50 outline-none resize-none transition-all"
                                    placeholder="Type your official announcement here... It will visibly pop up in the Global Chat room for all active users."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 bg-background/30 border border-border/50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold text-foreground/70">Attach Media (Optional)</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        accept="image/*,video/*"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    />
                                    {file ? (
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)} className="h-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10">
                                            <Trash className="h-3 w-3 mr-2" />
                                            Remove
                                        </Button>
                                    ) : (
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-xs glass-light border-border">
                                            Browse Files
                                        </Button>
                                    )}
                                </div>
                                {file && (
                                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 text-xs font-mono truncate">
                                        📁 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                    </div>
                                )}
                            </div>

                            <Button 
                                type="submit" 
                                disabled={sending || (!message.trim() && !file)}
                                className="w-full h-12 rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white"
                            >
                                {sending ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Broadcasting...</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" /> Send Broadcast to All Users</>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Instructions / Tips */}
                <div>
                    <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 h-full shadow-lg shadow-primary/5">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertCircle className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-foreground">How it works</h3>
                        </div>
                        <ul className="space-y-4 text-sm text-foreground/60 leading-relaxed">
                            <li className="flex gap-2">
                                <span className="text-primary font-black">•</span>
                                This tool posts a message into the new <strong>Global Chat Room</strong> on behalf of the administration.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-black">•</span>
                                Your message will be prefixed with 📢 <strong>*ANNOUNCEMENT*</strong>.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-black">•</span>
                                You can attach promotional banners, images, or video trailers.
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary font-black">•</span>
                                Users who are currently on the `/chat` page will see it appear instantly.
                            </li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    )
}
