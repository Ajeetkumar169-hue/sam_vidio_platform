"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Upload, Loader2, Link as LinkIcon, Smartphone, Video as VideoIcon, X, CheckCircle2, Pause, Play } from "lucide-react"
import { S3UploadManager, UploadProgress } from "@/lib/s3-upload-manager"

interface Category {
  _id?: string
  id?: string
  name: string
  slug: string
}

export default function UploadPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("device")

  // Form State
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [tags, setTags] = useState("")
  const [visibility, setVisibility] = useState("public")

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => { })
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  const [uploadManager, setUploadManager] = useState<S3UploadManager | null>(null)
  const [status, setStatus] = useState<UploadProgress["status"]>("idle")
  const [isComplete, setIsComplete] = useState(false)
  const [uploadedVideo, setUploadedVideo] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file")
        return
      }
      setSelectedFile(file)
      setTitle(file.name.split(".")[0])
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // Instantiate manager to check for existing sessions
      const manager = new S3UploadManager(file, (p) => {
          setProgress(p.percent)
          setStatus(p.status)
      })
      setUploadManager(manager)
      
      // If session was loaded (status will be 'paused' if session exists in manager constructor)
      setTimeout(() => {
          if (manager.getProgress().status === "paused") {
              toast.info("Unfinished upload detected. Click 'Publish' to resume.")
              setProgress(manager.getProgress().percent)
              setStatus("paused")
          }
      }, 100)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !categoryId) {
      toast.error("Please fill in all required fields")
      return
    }

    if (activeTab === "device" && !selectedFile) {
      toast.error("Please select a video file")
      return
    }

    if (activeTab === "link") {
        if (!videoUrl) {
           toast.error("Please provide a video URL")
           return
        }
        setLoading(true)
        try {
            const res = await fetch("/api/videos", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title, description, videoUrl, categoryId, tags, visibility
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success("Link video added!")
                router.push("/dashboard")
            } else {
                toast.error(data.error || "Failed to add video")
            }
        } catch (err) {
            toast.error("Network error")
        } finally {
            setLoading(false)
        }
        return
    }

    // Direct Cloudinary Upload
    setLoading(true)
    setStatus("uploading")
    setProgress(0)

    // Signed Cloudinary Upload (More reliable)
    setLoading(true)
    setStatus("uploading")
    setProgress(0)

    try {
        // 1. Get Signature from our backend
        console.log("📡 Getting upload signature...");
        const signRes = await fetch("/api/upload/sign", { method: "POST" })
        const signData = await signRes.json()

        if (signData.error) throw new Error(signData.error)

        const { signature, timestamp, cloudName, apiKey } = signData

        // 2. Upload to Cloudinary via XHR (for progress)
        const formData = new FormData()
        formData.append("file", selectedFile!)
        formData.append("api_key", apiKey)
        formData.append("timestamp", timestamp.toString())
        formData.append("signature", signature)
        // Note: No folder here to match the simplified signature

        console.log("☁️ Starting signed upload to Cloudinary...");

        const xhr = new XMLHttpRequest()
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100)
                setProgress(percent)
                console.log(`📊 Progress: ${percent}%`)
            }
        }

        const uploadPromise = new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText))
                } else {
                    console.error("❌ Cloudinary Error:", xhr.responseText)
                    reject(new Error("Cloudinary upload failed"))
                }
            }
            xhr.onerror = () => reject(new Error("Network error during upload"))
            xhr.send(formData)
        })

        const cloudinaryData: any = await uploadPromise
        console.log("✅ Cloudinary Success:", cloudinaryData)
        const finalUrl = cloudinaryData.secure_url

        // 3. Save to our database
        console.log("💾 Saving video metadata to DB...");
        const saveRes = await fetch("/api/videos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title,
                description,
                videoUrl: finalUrl,
                categoryId,
                tags,
                visibility,
                fileSize: selectedFile!.size,
                filePublicId: cloudinaryData.public_id
            })
        })

        const saveData = await saveRes.json()
        if (saveData.success) {
            setUploadedVideo(saveData.video)
            setIsComplete(true)
            toast.success("Upload successful!")
        } else {
            throw new Error(saveData.error || "Failed to save video details")
        }

    } catch (err: any) {
        toast.error(err.message || "Upload failed")
        setStatus("error")
    } finally {
        setLoading(false)
    }
  }

  const handlePause = () => {
      uploadManager?.pause()
  }

  const handleResume = () => {
      handleSubmit(new Event('submit') as any)
  }

  const handleCancel = async () => {
      if (confirm("Are you sure you want to cancel this upload? All progress will be lost.")) {
          await uploadManager?.cancel()
          clearFile()
          setUploadManager(null)
          setStatus("idle")
          setProgress(0)
          setLoading(false)
      }
  }

  const clearFile = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setIsComplete(false)
    setUploadedVideo(null)
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
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {isComplete ? "Upload Complete!" : "Upload Video"}
          </h1>
          <p className="text-muted-foreground">
            {isComplete ? "Your video is now live" : "Share your content. Only Title and Category are required."}
          </p>
        </div>

        {isComplete && uploadedVideo ? (
          <Card className="border-none bg-card shadow-2xl shadow-green-500/5">
            <CardContent className="p-8 flex flex-col items-center gap-6">
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                <video src={uploadedVideo.videoUrl} controls className="w-full h-full object-contain" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold">{uploadedVideo.title}</h3>
                <p className="text-sm text-muted-foreground">Successfully uploaded to S3</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={clearFile}>
                  Upload Another
                </Button>
                <Button className="flex-1 h-12 rounded-xl" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8 border-none bg-card shadow-2xl shadow-primary/5 min-h-[500px] overflow-hidden">
            <CardContent className="p-4 sm:p-6 md:p-10 space-y-8">
              <Tabs defaultValue="device" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-secondary/50 rounded-xl mx-auto max-w-sm lg:max-w-md shadow-inner">
                  <TabsTrigger value="device" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-sm font-bold">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Device Upload
                  </TabsTrigger>
                  <TabsTrigger value="link" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md transition-all text-sm font-bold">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Link Upload
                  </TabsTrigger>
                </TabsList>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 mt-8">

                {/* Left Column: Media Selection */}
                <div className="space-y-6">
                  <TabsContent value="device" className="mt-0 space-y-4">
                    {!selectedFile ? (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith("video/")) {
                            setSelectedFile(file);
                            setTitle(file.name.split(".")[0]);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                        className="group relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-2xl h-[300px] md:h-[400px] bg-secondary/20 hover:bg-secondary/40 hover:border-primary/50 cursor-pointer transition-all duration-300 overflow-hidden"
                      >
                        <div className="flex flex-col items-center gap-4 text-center p-6">
                          <div className="p-5 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                            <Upload className="h-8 w-8" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold">Click to upload or drag & drop</p>
                            <p className="text-sm text-muted-foreground mt-1">MP4, WebM, or OGG (Up to 1TB)</p>
                          </div>
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="video/*"
                          onChange={handleFileChange}
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-border shadow-lg">
                        {previewUrl && (
                          <video
                            src={previewUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-80 hover:opacity-100"
                          onClick={clearFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl flex items-center gap-3 border border-white/10">
                          <div className="p-2 bg-primary/20 text-primary rounded-lg">
                            <VideoIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-white/60 text-xs">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="link" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="videoUrl" className="text-base">Video Feed URL</Label>
                        <div className="relative group">
                          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            id="videoUrl"
                            placeholder="https://example.com/video.mp4"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            className="pl-10 h-12 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground px-1">
                          Paste a direct permanent link to an MP4 video file.
                        </p>
                      </div>

                      {videoUrl && (
                        <div className="rounded-2xl overflow-hidden bg-black aspect-video border border-border">
                          <video
                            src={videoUrl}
                            controls
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // If link is invalid, optionally handle here
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>

                {/* Right Column: Metadata */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="title" className="text-base">Title *</Label>
                      <Input
                        id="title"
                        placeholder="Give your video a catchy title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        maxLength={150}
                        className="h-12 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="description" className="text-base">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell viewers about your video..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        maxLength={5000}
                        className="bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label className="text-base">Category *</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger className="h-12 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {categories.map((cat) => (
                              <SelectItem key={cat._id || cat.id} value={(cat._id || cat.id)!} className="rounded-lg">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label className="text-base">Visibility</Label>
                        <Select value={visibility} onValueChange={setVisibility}>
                          <SelectTrigger className="h-12 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="public" className="rounded-lg">Public</SelectItem>
                            <SelectItem value="private" className="rounded-lg">Private</SelectItem>
                            <SelectItem value="unlisted" className="rounded-lg">Unlisted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="tags" className="text-base">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="trending, funny, music"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="h-12 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-xl"
                      />
                      <p className="text-xs text-muted-foreground px-1">Comma-separated keywords</p>
                    </div>
                  </div>

                  {/* Submission & Progress */}
                  <div className="pt-4 space-y-4">
                    {loading && (
                      <div className="space-y-3 bg-secondary/30 p-4 rounded-xl border border-primary/10">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="flex items-center gap-2">
                             {status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                             {status === "paused" && <Pause className="h-4 w-4 text-yellow-500" />}
                             {status === "error" && <X className="h-4 w-4 text-destructive" />}
                             {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <span className="text-primary">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3 rounded-full bg-secondary overflow-hidden">
                           <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                        </Progress>
                        
                        <div className="flex gap-2">
                            {status === "uploading" && (
                                <Button type="button" variant="outline" size="sm" className="flex-1 gap-2 rounded-lg" onClick={handlePause}>
                                    <Pause className="h-3 w-3" /> Pause
                                </Button>
                            )}
                            {status === "paused" && (
                                <Button type="button" variant="outline" size="sm" className="flex-1 gap-2 rounded-lg" onClick={handleResume}>
                                    <Play className="h-3 w-3" /> Resume
                                </Button>
                            )}
                            {(status === "uploading" || status === "paused" || status === "error") && (
                                <Button type="button" variant="ghost" size="sm" className="flex-1 gap-2 text-destructive hover:bg-destructive/10 rounded-lg" onClick={handleCancel}>
                                    <X className="h-3 w-3" /> Cancel
                                </Button>
                            )}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={loading || (activeTab === "device" && (!selectedFile || status === "uploading"))}
                      className="w-full h-14 text-lg font-bold rounded-xl gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                      {status === "uploading" ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Uploading {progress}%
                        </>
                      ) : status === "paused" ? (
                        <>
                          <Play className="h-5 w-5" />
                          Resume Upload
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5" />
                          Publish Video
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
              </Tabs>
            </CardContent>
          </Card>
      )}
      </div>
    </div>
  )
}

