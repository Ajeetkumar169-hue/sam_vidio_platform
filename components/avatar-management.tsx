"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Check, ImageIcon, Trash2, Camera, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { CameraCapture } from "./camera-capture"

export function AvatarManagement() {
  const { user, refresh } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const latestUploadRef = useRef<number>(0)

  // Memory Cleanup
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  if (!user) return null

  const gallery = user.galleryImages || []
  const currentAvatar = user.avatar || ""

  const uploadFile = async (file: File) => {
    // 1. Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large (Max 2MB)")
      return
    }

    // 2. Race Condition Protection
    const uploadId = Date.now()
    latestUploadRef.current = uploadId
    
    // 3. Instant Preview
    const previewUrl = URL.createObjectURL(file)
    setLocalPreview(previewUrl)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // 3. High-Speed Atomic Upload & Update
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Update failed")
      }

      const data = await res.json()

      // Only update if this is still the latest upload request
      if (latestUploadRef.current !== uploadId) return

      await refresh()
      toast.success("Profile updated instantly!")
    } catch (error: any) {
      if (latestUploadRef.current === uploadId) {
        toast.error(error.message || "Failed to update")
        setLocalPreview(null)
      }
    } finally {
      if (latestUploadRef.current === uploadId) {
        setIsUploading(false)
      }
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setIsUploading(false)
      return
    }
    await uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleTriggerCamera = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.info("Live camera not supported on this browser. Opening gallery instead.")
      fileInputRef.current?.click()
      return
    }
    setShowCamera(true)
  }

  const handleSetPrimary = async (url: string) => {
    if (url === currentAvatar) return
    setIsUploading(true)
    const uploadId = Date.now()
    latestUploadRef.current = uploadId

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: url }),
      })
      if (!res.ok) throw new Error("Failed to update avatar")
      
      if (latestUploadRef.current === uploadId) {
        await refresh()
        toast.success("Profile picture updated")
      }
    } catch (error) {
      if (latestUploadRef.current === uploadId) {
        toast.error("Error updating avatar")
      }
    } finally {
      if (latestUploadRef.current === uploadId) {
        setIsUploading(false)
      }
    }
  }

  const handleRemoveImage = async (url: string) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeGalleryImage: url }),
      })
      if (!res.ok) throw new Error("Failed to remove image")
      await refresh()
      toast.success("Image removed")
    } catch (error) {
      toast.error("Error removing image")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 luxury-easing">
      {/* Hidden Gallery Input */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Primary Display Picture */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative group">
          <div className={cn(
            "h-32 w-32 rounded-full overflow-hidden border-2 border-white/10 premium-shadow transition-all duration-500 group-hover:scale-105",
            isUploading && "animate-pulse opacity-50"
          )}>
            {localPreview || currentAvatar ? (
              <img 
                src={localPreview || currentAvatar} 
                alt={user.username} 
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}

            {isUploading && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
               </div>
            )}
          </div>
          
          <button 
            onClick={handleTriggerCamera}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full glass-heavy border border-white/10 text-primary shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/cam"
          >
             {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5 group-hover/cam:rotate-12 transition-transform" />}
          </button>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-medium text-foreground">{user.username}</h3>
          <p className="text-sm text-muted-foreground">{isUploading ? "Uploading fresh look..." : "Primary Display Picture"}</p>
        </div>
      </div>

      <CameraCapture 
        isOpen={showCamera} 
        onClose={() => setShowCamera(false)} 
        onCapture={(file) => uploadFile(file)} 
      />


      {/* Gallery Strip */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">Your Gallery</h4>
          <span className="text-[10px] text-muted-foreground/30">{gallery.length} Images</span>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 no-scrollbar snap-x snap-proximity">
          {/* Unified Action Button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex-shrink-0 h-24 w-24 rounded-2xl glass-light border-dashed border-white/10 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all duration-300 active:scale-95 snap-start disabled:opacity-50"
          >
            <Plus className="h-6 w-6" />
            <span className="text-[10px] font-medium">Add New</span>
          </button>

          {/* Gallery Items */}
          {gallery.map((url, i) => {
            const isPrimary = (url === currentAvatar) && !localPreview
            return (
              <div 
                key={`${url}-${i}`}
                className={cn(
                  "flex-shrink-0 group relative h-24 w-24 rounded-2xl overflow-hidden cursor-pointer snap-start transition-all duration-500",
                  isPrimary ? "ring-2 ring-primary ring-offset-4 ring-offset-transparent scale-105" : "hover:scale-105"
                )}
                onClick={() => handleSetPrimary(url)}
              >
                <img 
                  src={url} 
                  alt={`Gallery ${i}`} 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                {isPrimary && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[1px]">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveImage(url)
                  }}
                  className="absolute top-1 right-1 h-6 w-6 rounded-lg glass-heavy text-white/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )
          })}

          {gallery.length === 0 && !isUploading && (
            <div className="flex-1 flex items-center justify-center text-muted-foreground/20 italic text-sm py-8">
              No images in gallery yet...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

