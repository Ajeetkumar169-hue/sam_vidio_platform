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

/**
 * Auto-generates a thumbnail from a video file by seeking to ~10% duration.
 */
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

  // Detect mock/local mode
  useEffect(() => {
    fetch("/api/config")
      .then(r => r.json())
      .then(d => setIsMockMode(d.data?.mockMode ?? true))
      .catch(() => setIsMockMode(true))
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

    if (isMockMode) {
      await doDirectUpload()
    } else {
      await doS3ChunkedUpload()
    }
  }

  /**
   * LOCAL DEV: Direct upload via single HTTP request
   */
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
   * PRODUCTION (Vercel + S3): Chunked multipart upload directly to S3
   */
  const doS3ChunkedUpload = async () => {
    setStatus("uploading")
    pausedRef.current = false
    setErrorMsg(null)

    const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB
    const totalParts = Math.ceil(file!.size / CHUNK_SIZE)

    try {
      // Init or restore session
      let session = uploadStateRef.current
      if (!session) {
        const initRes = await fetch("/api/upload/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file!.name, contentType: file!.type, fileSize: file!.size })
        })
        const initJson = await initRes.json()
        if (!initJson.success) throw new Error(initJson.error || "Failed to initialize upload")
        session = { uploadId: initJson.data.uploadId, key: initJson.data.key, parts: [], uploaded: 0 }
        uploadStateRef.current = session
      }

      const doneParts = new Set(session.parts.map((p: any) => p.PartNumber))
      let startTime = Date.now()

      for (let partNum = 1; partNum <= totalParts; partNum++) {
        if (pausedRef.current) {
          setStatus("paused")
          return
        }
        if (doneParts.has(partNum)) continue

        const start = (partNum - 1) * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file!.size)
        const chunk = file!.slice(start, end)

        // Get signed URL for this part
        let url = ""
        for (let attempt = 0; attempt < 3; attempt++) {
          const urlRes = await fetch("/api/upload/url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: session.key, uploadId: session.uploadId, partNumber: partNum })
          })
          const urlJson = await urlRes.json()
          if (urlJson.success && urlJson.data?.url) { url = urlJson.data.url; break }
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)))
        }
        if (!url) throw new Error(`Failed to get upload URL for part ${partNum}`)

        // Upload chunk directly to S3
        const putRes = await fetch(url, {
          method: "PUT",
          body: chunk,
          headers: { "Content-Type": "application/octet-stream" }
        })
        if (!putRes.ok) throw new Error(`Chunk ${partNum} upload failed: HTTP ${putRes.status}`)
        const etag = putRes.headers.get("ETag")?.replace(/"/g, "") || `etag-${partNum}`

        session.parts.push({ PartNumber: partNum, ETag: etag })
        session.uploaded += chunk.size

        const pct = Math.round((partNum / totalParts) * 95)
        const elapsed = (Date.now() - startTime) / 1000
        setProgress(pct)
        setSpeed(Math.round((chunk.size / elapsed) / 1024 / 1024 * 10) / 10)
        startTime = Date.now()
      }

      // Finalize
      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: session.key,
          uploadId: session.uploadId,
          parts: session.parts.sort((a: any, b: any) => a.PartNumber - b.PartNumber),
          metadata: { ...metadata, thumbnailUrl: thumbnail || undefined, fileSize: file!.size }
        })
      })
      const completeJson = await completeRes.json()
      if (!completeJson.success) throw new Error(completeJson.error || "Finalization failed")

      uploadStateRef.current = null
      setProgress(100)
      setStatus("complete")
      toast.success("Video uploaded to S3! 🚀")
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
    doS3ChunkedUpload()
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
                {isMockMode === false ? "S3 Direct • No size limit" : "Local Upload • Auto Thumbnail"}
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
    </div>
  )
}
