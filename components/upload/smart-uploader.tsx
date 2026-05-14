"use client"

import { useState, useRef, useEffect } from "react"
import { Video as VideoIcon, Upload, Loader2, X, CheckCircle2, AlertCircle, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface SmartUploaderProps {
  onUploadComplete: (video: any) => void
  onFileSelected: (file: File | null) => void
  metadata: any
}

async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    }
    video.onerror = () => {
      resolve(0)
      URL.revokeObjectURL(video.src)
    }
    video.src = URL.createObjectURL(file)
  })
}

async function generateThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video")
      const url = URL.createObjectURL(file)
      video.src = url
      video.muted = true
      video.playsInline = true
      video.preload = "metadata"

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1)
      }
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = 640
          canvas.height = 360
          const ctx = canvas.getContext("2d")
          if (!ctx) { URL.revokeObjectURL(url); resolve(null); return }
          ctx.drawImage(video, 0, 0, 640, 360)
          URL.revokeObjectURL(url)
          resolve(canvas.toDataURL("image/jpeg", 0.8))
        } catch { URL.revokeObjectURL(url); resolve(null) }
      }
      video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
      setTimeout(() => { URL.revokeObjectURL(url); resolve(null) }, 8000)
    } catch { resolve(null) }
  })
}

export function SmartUploader({ onUploadComplete, onFileSelected, metadata }: SmartUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "thumbgen" | "uploading" | "paused" | "complete" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isMockMode, setIsMockMode] = useState<boolean | null>(null)
  const [angryError, setAngryError] = useState<{ show: boolean, msg: string, limit: string } | null>(null)

  // Detect mock/local mode
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(d => setIsMockMode(d.data?.isMock ?? false))
      .catch(() => setIsMockMode(false))
  }, [])

  // S3 chunked upload state
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const pausedRef = useRef(false)
  const uploadStateRef = useRef<{ uploadId: string; key: string; parts: any[]; uploaded: number } | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!f.type.startsWith("video/")) {
      toast.error("Please select a video file")
      return
    }

    // Check duration limits
    const duration = await getVideoDuration(f)
    if (metadata.isShort && duration > 120) {
      setAngryError({ 
        show: true, 
        msg: "You can't upload videos that are longer than 2 minutes.",
        limit: "Shorts Limit: 120 Seconds"
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    } else if (!metadata.isShort) {
      if (duration < 300) {
        setAngryError({ 
          show: true, 
          msg: "You cannot upload videos shorter than 5 minutes.",
          limit: "Minimum Requirement: 5 Minutes"
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      } else if (duration > 5400) {
        setAngryError({ 
          show: true, 
          msg: "You cannot upload videos longer than an hour and a half.",
          limit: "Video Limit: 1.5 Hours"
        })
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
    }

    setFile(f)
    onFileSelected(f)
    setPreviewUrl(URL.createObjectURL(f))
    setStatus("thumbgen")
    setProgress(0)
    setErrorMsg(null)

    const thumb = await generateThumbnail(f)
    setThumbnail(thumb)
    if (thumb) toast.success("Thumbnail auto-generated ✅")
    setStatus("idle")
  }

  const startUpload = async () => {
    if (!file) return
    if (metadata.isShort) {
      await doCloudinaryUpload()
    } else {
      await doStreamtapeUpload()
    }
  }

  /**
   * CLOUDINARY UPLOAD (For Shorts) - Gives raw .mp4 for auto-play and no ads
   */
  const doCloudinaryUpload = async () => {
    setStatus("uploading")
    setErrorMsg(null)

    try {
      // 1. Get Signature
      const signRes = await fetch("/api/upload/sign", { method: "POST" })
      const signJson = await signRes.json()
      if (!signJson.success) throw new Error("Failed to get upload signature")
      
      const { signature, timestamp, cloudName, apiKey } = signJson.data

      // 2. Upload to Cloudinary directly
      const formData = new FormData()
      formData.append("file", file!)
      formData.append("api_key", apiKey)
      formData.append("timestamp", timestamp.toString())
      formData.append("signature", signature)
      formData.append("folder", "shorts")

      let startTime = Date.now()
      let lastLoaded = 0

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95)
            setProgress(pct)
            const elapsed = (Date.now() - startTime) / 1000
            const speedBytes = (e.loaded - lastLoaded) / Math.max(elapsed, 0.1)
            setSpeed(Math.round(speedBytes / 1024 / 1024 * 10) / 10)
            lastLoaded = e.loaded
            startTime = Date.now()
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error("Invalid response from Cloudinary"))
            }
          }
          else reject(new Error(`Cloudinary error: ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error("Network error during upload to Cloudinary."))
        xhr.onabort = () => reject(new Error("Upload cancelled."))

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`)
        xhr.send(formData)
      })

      if (!uploadResult.secure_url) throw new Error("Cloudinary did not return a valid URL")

      // 3. Finalize upload
      const completeRes = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...metadata,
          videoUrl: uploadResult.secure_url,
          thumbnailUrl: thumbnail || uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg")
        })
      })
      
      const completeJson = await completeRes.json()
      if (!completeJson.success) throw new Error(completeJson.error || "Database save failed")

      setProgress(100)
      setStatus("complete")
      toast.success("Short uploaded! 🚀")
      onUploadComplete(completeJson.data?.video || completeJson.data)
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message)
      toast.error(err.message)
    }
  }
  const doDirectUpload = async () => {
    setStatus("uploading")
    setProgress(0)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append("file", file!)
      formData.append("metadata", JSON.stringify({
        ...metadata,
        thumbnailUrl: thumbnail || undefined,
      }))

      let startTime = Date.now()
      let lastLoaded = 0

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95)
            setProgress(pct)
            const elapsed = (Date.now() - startTime) / 1000
            const speedBytes = (e.loaded - lastLoaded) / Math.max(elapsed, 0.1)
            setSpeed(Math.round(speedBytes / 1024 / 1024 * 10) / 10)
            lastLoaded = e.loaded
            startTime = Date.now()
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error(`Server error: ${xhr.status} - ${xhr.responseText.slice(0, 200)}`))
        }
        xhr.onerror = () => reject(new Error("Network error. Check your connection."))
        xhr.onabort = () => reject(new Error("Upload cancelled."))

        xhr.open("POST", "/api/upload/direct")
        xhr.send(formData)
      })

      const json = JSON.parse(xhrRef.current!.responseText)
      if (!json.success) throw new Error(json.error || "Upload failed")

      setProgress(100)
      setStatus("complete")
      toast.success("Video uploaded! 🎉")
      onUploadComplete(json.data?.video || json.data)
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message)
      toast.error(err.message)
    }
  }

  /**
   * PRODUCTION (Vercel): Direct upload to Streamtape API
   */
  const doStreamtapeUpload = async () => {
    setStatus("uploading")
    pausedRef.current = false
    setErrorMsg(null)

    try {
      // 1. Get Streamtape Upload URL from our backend
      const initRes = await fetch("/api/upload/streamtape/init")
      const initJson = await initRes.json()
      if (!initJson.success) throw new Error(initJson.error || "Failed to initialize Streamtape upload")
      
      const uploadUrl = initJson.data.url

      // 2. Upload file to Streamtape
      const formData = new FormData()
      formData.append("file1", file!)

      let startTime = Date.now()
      let lastLoaded = 0

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 95)
            setProgress(pct)
            const elapsed = (Date.now() - startTime) / 1000
            const speedBytes = (e.loaded - lastLoaded) / Math.max(elapsed, 0.1)
            setSpeed(Math.round(speedBytes / 1024 / 1024 * 10) / 10)
            lastLoaded = e.loaded
            startTime = Date.now()
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              reject(new Error("Invalid response from Streamtape"))
            }
          }
          else reject(new Error(`Streamtape error: ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error("Network error during upload to Streamtape."))
        xhr.onabort = () => reject(new Error("Upload cancelled."))

        xhr.open("POST", uploadUrl)
        xhr.send(formData)
      })

      if (uploadResult.status !== 200 || !uploadResult.result?.url) {
        throw new Error("Streamtape upload failed or returned invalid data")
      }

      // 3. Finalize upload in our database
      const completeRes = await fetch("/api/upload/streamtape/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: uploadResult.result.id || Date.now().toString(),
          videoUrl: uploadResult.result.url,
          fileSize: file!.size,
          metadata: { ...metadata, thumbnailUrl: thumbnail || undefined }
        })
      })
      
      const completeJson = await completeRes.json()
      if (!completeJson.success) throw new Error(completeJson.error || "Database save failed")

      setProgress(100)
      setStatus("complete")
      toast.success("Video uploaded to Streamtape! 🚀")
      onUploadComplete(completeJson.data?.video || completeJson.data)
    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message)
      toast.error(err.message)
    }
  }

  const pauseUpload = () => {
    pausedRef.current = true
    setStatus("paused")
  }

  const resumeUpload = () => {
    pausedRef.current = false
    doStreamtapeUpload()
  }

  const clearFile = () => {
    xhrRef.current?.abort()
    pausedRef.current = true
    uploadStateRef.current = null
    setFile(null)
    onFileSelected(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setThumbnail(null)
    setStatus("idle")
    setProgress(0)
    setErrorMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const statusLabel = {
    idle: "Ready to Upload",
    thumbgen: "Generating Thumbnail...",
    uploading: `Uploading${speed > 0 ? ` • ${speed} MB/s` : ""}`,
    paused: "Paused (click Resume)",
    complete: "Upload Complete ✅",
    error: "Upload Failed",
  }[status]

  return (
    <div className="space-y-4">
      <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleFileChange} />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex flex-col items-center justify-center border-2 border-dashed border-primary/40 rounded-2xl h-[300px] bg-primary/5 hover:bg-primary/10 hover:border-primary cursor-pointer transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="p-5 rounded-full bg-primary text-white group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
              <VideoIcon className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-primary italic uppercase tracking-tighter">Upload Video</p>
              <p className="text-sm font-bold text-muted-foreground">
                {isMockMode === false ? "Streamtape Upload • Unlimited" : "Local Upload • Auto Thumbnail"}
              </p>
            </div>
            <Button type="button" className="mt-2 rounded-full px-8 font-bold">Select Video</Button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-border shadow-lg">
          {thumbnail ? (
            <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
          ) : previewUrl ? (
            <video src={previewUrl} className="w-full h-full object-contain" muted playsInline />
          ) : null}

          <Button
            variant="destructive" size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8 z-10"
            onClick={clearFile}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-md p-4 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-2">
                  {(status === "uploading" || status === "thumbgen") && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  {status === "complete" && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                  {status === "error" && <AlertCircle className="h-3 w-3 text-red-400" />}
                  <span className={status === "error" ? "text-red-400" : status === "complete" ? "text-green-400" : "text-white"}>
                    {statusLabel}
                  </span>
                </span>
                <span className={status === "complete" ? "text-green-400" : "text-white/80"}>
                  {file && `${(file.size / 1024 / 1024).toFixed(1)} MB`}
                  {progress > 0 && ` • ${status === "complete" ? 100 : progress}%`}
                </span>
              </div>

              <Progress
                value={status === "complete" ? 100 : progress}
                className={`h-1.5 ${status === "error" ? "[&>div]:bg-red-500" : status === "complete" ? "[&>div]:bg-green-500" : ""}`}
              />

              {errorMsg && <p className="text-[10px] text-red-400">{errorMsg}</p>}

              <div className="flex gap-2">
                {status === "idle" && (
                  <Button size="sm" className="h-7 text-[10px] flex-1" onClick={startUpload}>
                    <Upload className="h-3 w-3 mr-1" /> Start Upload
                  </Button>
                )}
                {status === "uploading" && !isMockMode && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={pauseUpload}>
                    <Pause className="h-3 w-3 mr-1" /> Pause
                  </Button>
                )}
                {status === "paused" && (
                  <Button size="sm" className="h-7 text-[10px] flex-1" onClick={resumeUpload}>
                    <Play className="h-3 w-3 mr-1" /> Resume
                  </Button>
                )}
                {status === "error" && (
                  <Button size="sm" className="h-7 text-[10px] flex-1" onClick={startUpload}>
                    <Upload className="h-3 w-3 mr-1" /> Retry
                  </Button>
                )}
                {status === "complete" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 text-green-400 border-green-400/30" disabled>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Done
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Angry Error Overlay for Duration Limits */}
      {angryError?.show && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-500">
          <div className="flex flex-col items-center gap-10 text-center px-6 max-w-lg">
            <div className="relative group">
              <div className="absolute -inset-8 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
              <span className="text-9xl md:text-[15rem] inline-block animate-bounce drop-shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                🤬
              </span>
              <div className="absolute -top-4 -right-4 text-5xl md:text-7xl animate-ping opacity-75">💢</div>
              <div className="absolute -bottom-4 -left-4 text-4xl md:text-6xl animate-pulse delay-75">💨</div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl md:text-6xl font-black text-red-500 italic uppercase tracking-tighter leading-none [text-shadow:0_0_30px_rgba(239,68,68,0.3)]">
                UPLOAD BLOCKED!
              </h2>
              <div className="space-y-2">
                <p className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight">
                    {angryError.msg}
                </p>
                <p className="text-sm font-medium text-white/40 uppercase tracking-[0.3em]">
                    {angryError.limit}
                </p>
              </div>
            </div>

            <Button 
              variant="destructive" 
              size="lg" 
              className="h-16 px-12 rounded-2xl text-xl font-black uppercase tracking-tighter shadow-2xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
              onClick={() => setAngryError(null)}
            >
              I UNDERSTAND
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
