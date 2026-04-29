"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import useSWR from "swr"
import { Send, Image as ImageIcon, Mic, Smile, Paperclip, Loader2, Play, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// A mini emoji list for the native picker
const EMOJIS = ["😀", "😂", "🥰", "😎", "😭", "😡", "👍", "🔥", "❤️", "✨", "🙌", "🎉", "👀", "💯", "🙏"]

export default function ChatPage() {
    const { user } = useAuth()
    const [newMessage, setNewMessage] = useState("")
    const [sending, setSending] = useState(false)
    const [showEmojis, setShowEmojis] = useState(false)
    
    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [audioChunks, setAudioChunks] = useState<Blob[]>([])
    
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Short-polling every 3 seconds for new messages
    const { data, error, mutate } = useSWR("/api/chat?limit=100", fetcher, { 
        refreshInterval: 3000,
        revalidateOnFocus: true
    })

    const messages = data?.messages || []

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages.length]) // Triggered when message count changes

    // Handle sending a text message
    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!newMessage.trim()) return

        try {
            setSending(true)
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newMessage, messageType: "text" })
            })
            if (!res.ok) throw new Error("Failed to send")
            
            setNewMessage("")
            setShowEmojis(false)
            mutate() // Optimistic UI update
        } catch (err: any) {
            toast.error(err.message || "Failed to send message")
        } finally {
            setSending(false)
        }
    }

    // Handle File Uploads (Images/Videos)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append("file", file)

        const toastId = toast.loading("Sending media...")
        try {
            const upRes = await fetch("/api/chat/upload", {
                method: "POST",
                body: formData
            })
            const upData = await upRes.json()
            if (!upRes.ok) throw new Error(upData.error)

            // Send actual message
            await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageType: upData.type, mediaUrl: upData.url })
            })
            
            mutate()
            toast.success("Media sent", { id: toastId })
        } catch (err: any) {
            toast.error(err.message || "Upload failed", { id: toastId })
        }
    }

    // Handle Voice Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks: Blob[] = []

            recorder.ondataavailable = e => chunks.push(e.data)
            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' })
                
                // Upload audio
                const formData = new FormData()
                formData.append("file", audioBlob, "voice_note.webm")
                
                const toastId = toast.loading("Sending voice note...")
                try {
                    const upRes = await fetch("/api/chat/upload", { method: "POST", body: formData })
                    const upData = await upRes.json()
                    
                    if (upRes.ok) {
                        await fetch("/api/chat", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ messageType: "audio", mediaUrl: upData.url })
                        })
                        mutate()
                        toast.success("Voice note sent!", { id: toastId })
                    }
                } catch (e) {
                    toast.error("Failed to send voice note", { id: toastId })
                }
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
        } catch (err) {
            toast.error("Microphone access denied or unavailable")
        }
    }

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop()
            setIsRecording(false)
            // Cleanup tracks
            mediaRecorder.stream.getTracks().forEach(t => t.stop())
        }
    }

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    if (!user) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Sign in to join the Chat</h2>
                    <Link href="/login">
                        <Button className="rounded-full px-8">Login</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100dvh-128px)] lg:h-[calc(100dvh-4rem)] max-w-4xl mx-auto bg-background/50 border-x border-border/50 relative overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-border bg-card/80 backdrop-blur z-10 shadow-sm shrink-0">
                <div className="flex -space-x-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-background z-20">
                        <span className="text-primary font-bold">G</span>
                    </div>
                </div>
                <div>
                    <h1 className="text-lg font-bold">Global Communtiy</h1>
                    <p className="text-xs text-primary max-w-sm truncate whitespace-nowrap overflow-hidden">
                        Online (Live Sync Active)
                    </p>
                </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-transparent to-background/50 platinum-scrollbar" style={{ backgroundImage: "url('/chat-bg-pattern.png')", backgroundSize: "400px", backgroundBlendMode: "overlay" }}>
                
                {error && <p className="text-center text-red-500 text-xs">Connection error. Retrying...</p>}
                {!data && !error && <div className="flex justify-center"><Loader2 className="animate-spin text-primary mt-10" /></div>}

                {messages.map((msg: any, i: number) => {
                    const isMe = msg.sender?._id === user.id
                    const isFirstInGroup = i === 0 || messages[i-1]?.sender?._id !== msg.sender?._id

                    return (
                        <div key={msg._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            {/* Avatar & Name (Only show for others, and only on first message of group) */}
                            {!isMe && isFirstInGroup && (
                                <div className="flex items-center gap-2 mb-1 ml-1 mt-2">
                                    <img src={msg.sender?.avatar || "/default-avatar.png"} className="h-5 w-5 rounded-full object-cover" alt="" />
                                    <span className="text-[10px] font-bold text-muted-foreground">{msg.sender?.username || "Unknown"}</span>
                                </div>
                            )}

                            {/* Bubble */}
                            <div className={`
                                relative max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm 
                                ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border/50 text-foreground rounded-tl-sm"}
                            `}>
                                {/* Media Rendering */}
                                {msg.messageType === "image" && msg.mediaUrl && (
                                    <img src={msg.mediaUrl} alt="uploaded" className="max-w-full rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.mediaUrl, "_blank")} />
                                )}
                                {msg.messageType === "video" && msg.mediaUrl && (
                                    <video src={msg.mediaUrl} controls className="max-w-full rounded-xl mb-2" />
                                )}
                                {msg.messageType === "audio" && msg.mediaUrl && (
                                    <audio src={msg.mediaUrl} controls className="max-w-full h-10 mb-2" />
                                )}

                                {/* Text Content */}
                                {msg.content && <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>}

                                {/* Time Stamp */}
                                <span className={`text-[9px] mt-1 block text-right font-medium opacity-60`}>
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} className="h-1 pb-4" /> {/* Spacer for auto-scroll */}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border shrink-0 relative">
                
                {/* Emoji Picker Popup */}
                {showEmojis && (
                    <div className="absolute bottom-full left-4 mb-2 bg-popover border border-border rounded-xl p-3 shadow-2xl grid grid-cols-5 gap-3 animate-in zoom-in-95 duration-200">
                        {EMOJIS.map(e => (
                            <button key={e} onClick={() => { setNewMessage(prev => prev + e); setShowEmojis(false) }} className="text-2xl hover:scale-125 transition-transform">
                                {e}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2">
                    
                    {/* Hidden File Input */}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                    
                    <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-full mb-1 text-muted-foreground hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-5 w-5" />
                    </Button>

                    <div className="flex-1 bg-background/50 border border-border rounded-3xl flex items-center pr-2 pl-4 focus-within:ring-1 ring-primary/30 transition-all min-h-[44px]">
                        <Button type="button" variant="ghost" size="icon" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground rounded-full -ml-2 mr-1" onClick={() => setShowEmojis(!showEmojis)}>
                            <Smile className="h-5 w-5" />
                        </Button>
                        
                        <input
                            type="text"
                            placeholder="Type a message..."
                            className="flex-1 bg-transparent outline-none text-sm py-3"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        
                        {/* Send or Mic Button */}
                        {newMessage.trim() ? (
                            <Button type="submit" size="icon" disabled={sending} className="shrink-0 h-8 w-8 rounded-full bg-primary hover:bg-primary/90 shadow-md">
                                {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white ml-0.5" />}
                            </Button>
                        ) : (
                            <Button 
                                type="button" 
                                size="icon" 
                                className={`shrink-0 h-8 w-8 rounded-full transition-all ${isRecording ? 'bg-destructive animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.5)]' : 'bg-secondary hover:bg-secondary/80'}`}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                            >
                                {isRecording ? <Square className="h-4 w-4 text-white" fill="currentColor" /> : <Mic className="h-4 w-4 text-foreground" />}
                            </Button>
                        )}
                    </div>
                </form>
                {isRecording && <p className="text-center text-xs text-destructive mt-2 animate-pulse font-bold">Recording... Release to send</p>}
            </div>
        </div>
    )
}
