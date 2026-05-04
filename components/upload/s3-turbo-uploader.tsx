"use client"

import { useState, useRef, useEffect } from "react"
import { Video as VideoIcon, Upload, Loader2, Pause, Play, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { S3UploadManager, UploadProgress } from "@/lib/s3-upload-manager"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface S3TurboUploaderProps {
    onUploadComplete: (video: any) => void;
    onFileSelected: (file: File | null) => void;
    metadata: any;
}

export function S3TurboUploader({ onUploadComplete, onFileSelected, metadata }: S3TurboUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [uploadManager, setUploadManager] = useState<S3UploadManager | null>(null)
    const [progress, setProgress] = useState<UploadProgress>({
        percent: 0,
        uploadedBytes: 0,
        totalBytes: 0,
        status: "idle",
        speedMbps: 0,
        eta: 0,
        message: ""
    })

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!file.type.startsWith("video/")) {
                toast.error("Invalid file type. Please select a video.")
                return
            }
            setSelectedFile(file)
            onFileSelected(file)
            setPreviewUrl(URL.createObjectURL(file))

            const manager = new S3UploadManager(file, (p) => {
                setProgress(p)
            })
            setUploadManager(manager)

            manager.checkResume().then(hasSession => {
                if (hasSession) {
                    toast.info("Resumable upload session found.")
                    setProgress(manager.getProgress())
                }
            })
        }
    }

    const startUpload = async () => {
        if (!uploadManager) return
        try {
            const result = await uploadManager.start(metadata)
            if (result.success) {
                onUploadComplete(result.video)
                toast.success("S3 Turbo Upload Complete!")
            }
        } catch (err: any) {
            toast.error(err.message || "Upload failed")
        }
    }

    const clearFile = () => {
        if (uploadManager) uploadManager.cancel()
        setSelectedFile(null)
        onFileSelected(null)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
        setUploadManager(null)
        setProgress({ percent: 0, uploadedBytes: 0, totalBytes: 0, status: "idle", speedMbps: 0, eta: 0, message: "" })
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

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
                            <p className="text-xl font-black text-primary italic uppercase tracking-tighter">S3 TURBO MODE</p>
                            <p className="text-sm font-bold">Parallel Edge Ingestion Enabled</p>
                        </div>
                        <Button type="button" className="mt-4 rounded-full px-8 font-bold">Select Video</Button>
                    </div>
                </div>
            ) : (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-border shadow-lg">
                    {previewUrl && <video src={previewUrl} controls className="w-full h-full object-contain" />}
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8 opacity-80 hover:opacity-100" onClick={clearFile}>
                        <X className="h-4 w-4" />
                    </Button>
                    
                    {/* Floating Progress Overlay */}
                    {!!selectedFile && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-4 border-t border-white/10">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold text-white">
                                    <span className="flex items-center gap-2">
                                        {progress.status === "uploading" && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                        {progress.status.toUpperCase()} 
                                        {(progress.speedMbps ?? 0) > 0 && <span className="text-white/50">{progress.speedMbps} Mbps</span>}
                                    </span>
                                    <span>{progress.percent}%</span>
                                </div>
                                <Progress value={progress.percent} className="h-1.5" />
                                <div className="flex gap-2">
                                    {progress.status === "uploading" && <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={() => uploadManager?.pause()}><Pause className="h-3 w-3 mr-1" /> Pause</Button>}
                                    {progress.status === "paused" && <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={startUpload}><Play className="h-3 w-3 mr-1" /> Resume</Button>}
                                    {progress.status === "idle" && <Button size="sm" className="h-7 text-[10px] flex-1" onClick={startUpload}><Upload className="h-3 w-3 mr-1" /> Start Upload</Button>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
