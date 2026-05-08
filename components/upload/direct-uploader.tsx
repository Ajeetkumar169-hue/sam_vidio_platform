"use client"

import { useState, useRef } from "react"
import { Video as VideoIcon, Upload, Loader2, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface DirectUploaderProps {
  onUploadComplete: (video: any) => void
  onFileSelected: (file: File | null) => void
  metadata: any
}

/**
 * Generates a thumbnail from a video file by seeking to 1 second.
 * Returns a data URL (base64 PNG).
 */
async function generateThumbnailFromVideo(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video")
      const url = URL.createObjectURL(file)
      video.src = url
      video.muted = true
      video.playsInline = true
      video.preload = "metadata"

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1) // 10% into video or 1s
      }

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = 640
          canvas.height = 360
          const ctx = canvas.getContext("2d")
          if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
          ctx.drawImage(video, 0, 0, 640, 360)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
          URL.revokeObjectURL(url)
          resolve(dataUrl)
        } catch {
          URL.revokeObjectURL(url)
          resolve(null)
        }
      }

      video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
      // Safety timeout
      setTimeout(() => { URL.revokeObjectURL(url); resolve(null) }, 8000)
    } catch {
      resolve(null)
    }
  })
}

export function DirectUploader({ onUploadComplete, onFileSelected, metadata }: DirectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "generating-thumb" | "uploading" | "complete" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("video/")) {
      toast.error("Invalid file type. Please select a video.")
      return
    }

    setSelectedFile(file)
    onFileSelected(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStatus("generating-thumb")
    setProgress(0)
    setErrorMsg(null)

    // Auto-generate thumbnail like WhatsApp
    const thumb = await generateThumbnailFromVideo(file)
    setThumbnailDataUrl(thumb)
    if (thumb) {
      toast.success("Thumbnail auto-generated from video ✅")
    }
    setStatus("idle")
  }

  const startUpload = async () => {
    if (!selectedFile) return
    setStatus("uploading")
    setProgress(0)
    setErrorMsg(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("metadata", JSON.stringify({
        ...metadata,
        thumbnailUrl: thumbnailDataUrl || undefined,
      }))

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 95)) // cap at 95 until server confirms
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Server error: ${xhr.status} - ${xhr.responseText}`))
          }
        }

        xhr.onerror = () => reject(new Error("Network error. Please check your connection."))
        xhr.onabort = () => reject(new Error("Upload cancelled."))

        xhr.open("POST", "/api/upload/direct")
        xhr.send(formData)
      })

      // Parse response
      const xhr = xhrRef.current!
      const json = JSON.parse(xhr.responseText)
      if (!json.success) throw new Error(json.error || "Upload failed on server")

      setProgress(100)
      setStatus("complete")
      toast.success("Video uploaded successfully! 🎉")
      onUploadComplete(json.data?.video || json.data)

    } catch (err: any) {
      setStatus("error")
      setErrorMsg(err.message)
      toast.error(err.message || "Upload failed")
    }
  }

  const cancelUpload = () => {
    xhrRef.current?.abort()
    setStatus("idle")
  }

  const clearFile = () => {
    if (status === "uploading") xhrRef.current?.abort()
    setSelectedFile(null)
    onFileSelected(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setThumbnailDataUrl(null)
    setStatus("idle")
    setProgress(0)
    setErrorMsg(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const statusLabel = {
    idle: "Ready",
    "generating-thumb": "Generating thumbnail...",
    uploading: "Uploading...",
    complete: "Uploaded!",
    error: "Failed",
  }[status]

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
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
              <p className="text-sm font-bold text-muted-foreground">Auto-thumbnail • Works with any video</p>
            </div>
            <Button type="button" className="mt-2 rounded-full px-8 font-bold">
              Select Video
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-border shadow-lg">
          {/* Show thumbnail preview if generated, else show video preview */}
          {thumbnailDataUrl && status !== "generating-thumb" ? (
            <img src={thumbnailDataUrl} alt="Video thumbnail" className="w-full h-full object-cover" />
          ) : previewUrl ? (
            <video src={previewUrl} className="w-full h-full object-contain" muted playsInline />
          ) : null}

          {/* Close button */}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-80 hover:opacity-100 z-10"
            onClick={clearFile}
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Progress overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-md p-4 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-2">
                  {status === "generating-thumb" && <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />}
                  {status === "uploading" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                  {status === "complete" && <CheckCircle2 className="h-3 w-3 text-green-400" />}
                  <span className={status === "error" ? "text-red-400" : "text-white"}>
                    {statusLabel}
                  </span>
                  {selectedFile && (
                    <span className="text-white/40 font-normal">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  )}
                </span>
                <span className={status === "complete" ? "text-green-400" : "text-white"}>
                  {status === "complete" ? "100%" : `${progress}%`}
                </span>
              </div>

              <Progress
                value={status === "complete" ? 100 : progress}
                className={`h-1.5 ${status === "error" ? "[&>div]:bg-red-500" : status === "complete" ? "[&>div]:bg-green-500" : ""}`}
              />

              {errorMsg && (
                <p className="text-[10px] text-red-400 font-medium">{errorMsg}</p>
              )}

              <div className="flex gap-2">
                {status === "idle" && (
                  <Button size="sm" className="h-7 text-[10px] flex-1 rounded-lg" onClick={startUpload}>
                    <Upload className="h-3 w-3 mr-1" /> Start Upload
                  </Button>
                )}
                {status === "uploading" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 rounded-lg" onClick={cancelUpload}>
                    Cancel
                  </Button>
                )}
                {status === "error" && (
                  <Button size="sm" className="h-7 text-[10px] flex-1 rounded-lg" onClick={startUpload}>
                    <Upload className="h-3 w-3 mr-1" /> Retry
                  </Button>
                )}
                {status === "complete" && (
                  <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1 rounded-lg text-green-400 border-green-400/30" disabled>
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Upload Complete
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
