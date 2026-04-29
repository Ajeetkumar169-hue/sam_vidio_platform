"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, X, Check } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CameraCaptureProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isFocusing, setIsFocusing] = useState(false)
  const [showFlash, setShowFlash] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }, [stream])

  const startCamera = useCallback(async () => {
    stopStream()
    setIsReady(false)
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1080 },
          height: { ideal: 1080 },
          aspectRatio: 1
        }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        setStream(newStream)
      }
    } catch (err) {
      console.error("Camera Error:", err)
      toast.error("Camera access denied. Please allow camera permissions in your browser settings to use this feature.")
      onClose()
    }
  }, [facingMode, onClose, stopStream])

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera()
    }
    return () => stopStream()
  }, [isOpen, capturedImage, startCamera, stopStream])

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isFocusing) return

    // Premium UX: Auto-Focus Simulation
    setIsFocusing(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Flash Effect
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 200)

    const video = videoRef.current
    const canvas = canvasRef.current
    const size = Math.min(video.videoWidth, video.videoHeight)
    
    canvas.width = size
    canvas.height = size
    
    const context = canvas.getContext("2d")
    if (context) {
      const startX = (video.videoWidth - size) / 2
      const startY = (video.videoHeight - size) / 2
      
      context.drawImage(
        video, 
        startX, startY, size, size,
        0, 0, size, size
      )
      
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
      setCapturedImage(dataUrl)
      setIsFocusing(false)
      stopStream()
    }
  }

  const handleConfirm = () => {
    if (capturedImage) {
      // Convert DataURL to File
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
          onCapture(file)
          handleClose()
        })
    }
  }

  const handleClose = () => {
    stopStream()
    setCapturedImage(null)
    onClose()
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md glass-heavy border-white/5 text-foreground p-0 overflow-hidden outline-none shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Take Profile Photo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Center your face and snap a photo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full bg-black/5 overflow-hidden border-y border-foreground/5">
          {!capturedImage ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                onLoadedMetadata={() => setIsReady(true)}
                className={cn(
                  "h-full w-full object-cover transition-all duration-500",
                  facingMode === "user" ? "-scale-x-100" : "", // Mirror front cam
                  isReady ? "opacity-100" : "opacity-0",
                  isFocusing ? "scale-110 blur-[1px]" : "scale-100" // Focus animation
                )}
              />
              {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary/50" />
                </div>
              )}
              {/* Flash Overlay */}
              <div className={cn(
                "absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none",
                showFlash ? "opacity-100" : "opacity-0"
              )} />
            </>
          ) : (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className={cn(
                "h-full w-full object-cover animate-in fade-in duration-500",
                facingMode === "user" ? "-scale-x-100" : ""
              )} 
            />
          )}

          {/* Guidelines Overlay */}
          <div className="absolute inset-0 border-[40px] border-black/10 pointer-events-none">
             <div className="h-full w-full border border-white/20 rounded-full shadow-[0_0_0_100vw_rgba(0,0,0,0.2)]" />
          </div>
        </div>

        <div className="p-8 flex items-center justify-center gap-6 bg-foreground/[0.02]">
          {!capturedImage ? (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={handleClose}
                className="h-12 w-12 rounded-full glass-light border-foreground/10 hover:bg-foreground/10 text-foreground"
              >
                <X className="h-5 w-5" />
              </Button>
              
              <button
                onClick={takePhoto}
                disabled={!isReady}
                className="h-20 w-20 rounded-full bg-primary border-[6px] border-white/30 flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              >
                <div className="h-8 w-8 rounded-full border-2 border-white/40" />
              </button>

              <Button
                variant="outline"
                size="icon"
                onClick={toggleCamera}
                className="h-12 w-12 rounded-full glass-light border-foreground/10 hover:bg-foreground/10 text-foreground"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex w-full gap-4">
               <Button
                variant="outline"
                onClick={() => setCapturedImage(null)}
                className="flex-1 h-14 rounded-2xl glass-light border-foreground/10 hover:bg-foreground/5 text-muted-foreground"
              >
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20"
              >
                <Check className="h-5 w-5 mr-2" />
                Use Photo
              </Button>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
