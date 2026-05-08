"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smartphone, Link as LinkIcon, Loader2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SmartUploader } from "@/components/upload/smart-uploader"
import { VideoMetadataForm } from "@/components/upload/video-metadata-form"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function UploadPage() {
    const { user, isLoading: authLoading } = useAuth()
    const router = useRouter()
    const [categories, setCategories] = useState([])
    const [activeTab, setActiveTab] = useState("device")
    const [isComplete, setIsComplete] = useState(false)
    const [uploadedVideo, setUploadedVideo] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [uploadType, setUploadType] = useState<"video" | "short">("video")

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        categoryId: "",
        tags: "",
        visibility: "public",
        videoUrl: ""
    })

    useEffect(() => {
        fetch("/api/categories")
            .then(r => r.json())
            .then(d => setCategories(d.data?.categories || d.categories || []))
            .catch(() => {})
    }, [])

    useEffect(() => {
        if (!authLoading && !user) router.push("/login")
    }, [user, authLoading, router])

    const handleFormChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title || !formData.categoryId || !formData.videoUrl) {
            return toast.error("Please fill title, category, and video link")
        }

        setLoading(true)
        try {
            const res = await fetch("/api/videos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    isShort: uploadType === "short"
                })
            })
            const result = await res.json()
            if (result.success) {
                toast.success("Video linked successfully!")
                router.push("/dashboard")
            } else {
                toast.error(result.error || "Failed to link video")
            }
        } catch (err) {
            toast.error("Network error")
        } finally {
            setLoading(false)
        }
    }

    if (authLoading || !user) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-screen-xl px-4 py-8 md:py-12">
            <div className="mx-auto max-w-4xl space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl italic uppercase text-primary">
                        {isComplete ? "UPLOAD SUCCESS!" : "UPLOAD VIDEO"}
                    </h1>
                    <p className="text-muted-foreground font-medium">
                        {isComplete ? "Your video is ready to play!" : "Auto-thumbnail • Any video format • Instant playback"}
                    </p>
                </div>

                {isComplete && uploadedVideo ? (
                    <Card className="border-none bg-card shadow-2xl shadow-primary/10 rounded-3xl overflow-hidden">
                        <CardContent className="p-8 flex flex-col items-center gap-6">
                            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
                                <video src={uploadedVideo.videoUrl} controls className="w-full h-full object-contain" />
                            </div>
                            <div className="flex gap-4 w-full">
                                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-bold" onClick={() => setIsComplete(false)}>Upload Another</Button>
                                <Button className="flex-1 h-14 rounded-2xl font-bold" onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none bg-card shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
                        <CardContent className="p-6 md:p-10">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                                <TabsList className="grid w-full grid-cols-2 h-14 bg-secondary/30 rounded-2xl p-1 max-w-md mx-auto">
                                    <TabsTrigger value="device" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                        <Smartphone className="mr-2 h-4 w-4" /> Device
                                    </TabsTrigger>
                                    <TabsTrigger value="link" className="rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                                        <LinkIcon className="mr-2 h-4 w-4" /> Link
                                    </TabsTrigger>
                                </TabsList>

                                {/* Type Selection: Video vs Short */}
                                <div className="flex justify-center gap-4">
                                    <Button 
                                        variant={uploadType === "video" ? "default" : "outline"} 
                                        className={cn("rounded-2xl h-12 px-8 font-bold", uploadType === "video" ? "shadow-lg shadow-primary/20" : "opacity-60")}
                                        onClick={() => setUploadType("video")}
                                    >
                                        Videos
                                    </Button>
                                    <Button 
                                        variant={uploadType === "short" ? "default" : "outline"} 
                                        className={cn("rounded-2xl h-12 px-8 font-bold", uploadType === "short" ? "shadow-lg shadow-primary/20" : "opacity-60")}
                                        onClick={() => setUploadType("short")}
                                    >
                                        SoftPorn (Shorts)
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <TabsContent value="device" className="mt-0">
                                            <SmartUploader 
                                                metadata={{
                                                    ...formData,
                                                    isShort: uploadType === "short"
                                                }}
                                                onFileSelected={(file) => {
                                                    if (file && !formData.title) {
                                                        handleFormChange("title", file.name.split(".").slice(0, -1).join("."))
                                                    }
                                                }}
                                                onUploadComplete={(video) => {
                                                    setUploadedVideo(video)
                                                    setIsComplete(true)
                                                }}
                                            />
                                        </TabsContent>

                                        <TabsContent value="link" className="mt-0 space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold opacity-70">Video URL</label>
                                                <div className="relative">
                                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <input 
                                                        className="w-full h-12 pl-10 bg-secondary/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
                                                        placeholder="https://example.com/video.mp4"
                                                        value={formData.videoUrl}
                                                        onChange={(e) => handleFormChange("videoUrl", e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            {formData.videoUrl && (
                                                <div className="aspect-video rounded-xl overflow-hidden bg-black border border-border">
                                                    <video src={formData.videoUrl} controls className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                            <Button 
                                                className="w-full h-12 rounded-xl font-bold" 
                                                disabled={loading}
                                                onClick={handleLinkSubmit}
                                            >
                                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Link Video"}
                                            </Button>
                                        </TabsContent>
                                    </div>

                                    <div className="space-y-6">
                                        {uploadType === "video" ? (
                                            <VideoMetadataForm 
                                                data={formData}
                                                categories={categories}
                                                onChange={handleFormChange}
                                            />
                                        ) : (
                                            <div className="space-y-4 bg-secondary/20 p-6 rounded-3xl border border-white/5">
                                                <p className="text-sm font-black uppercase tracking-widest text-primary mb-2">Short Metadata</p>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold opacity-50 uppercase">Title</label>
                                                    <input 
                                                        className="w-full h-12 px-4 bg-secondary/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
                                                        placeholder="Short Title..."
                                                        value={formData.title}
                                                        onChange={(e) => handleFormChange("title", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold opacity-50 uppercase">Description</label>
                                                    <textarea 
                                                        className="w-full min-h-[100px] p-4 bg-secondary/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
                                                        placeholder="Tell us about this short..."
                                                        value={formData.description}
                                                        onChange={(e) => handleFormChange("description", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold opacity-50 uppercase">Visibility</label>
                                                    <select 
                                                        className="w-full h-12 px-4 bg-secondary/30 border-none rounded-xl focus:ring-1 focus:ring-primary"
                                                        value={formData.visibility}
                                                        onChange={(e) => handleFormChange("visibility", e.target.value)}
                                                    >
                                                        <option value="public">Public</option>
                                                        <option value="private">Private</option>
                                                        <option value="unlisted">Unlisted</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                        <div className="pt-4 flex flex-col gap-3">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold text-center">
                                                * Title and Category are required
                                            </p>
                                            {activeTab === "device" && (
                                                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                                                    <Upload className="h-5 w-5 text-primary" />
                                                    <p className="text-xs font-medium text-primary">Auto-thumbnail is generated from your video. Any format supported.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
