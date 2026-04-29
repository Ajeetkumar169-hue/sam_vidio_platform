"use client"

import { useState, useRef } from "react"
import { Camera, Loader2, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface BrandUploadProps {
  channelSlug: string
  type: "logo" | "banner"
  currentValue?: string
  onUpdate: (newUrl: string) => void
  className?: string
}

export function BrandUpload({ 
  channelSlug, 
  type, 
  currentValue, 
  onUpdate,
  className 
}: BrandUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Please upload an image.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (Max 5MB)")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      // 1. Upload the image
      const uploadRes = await fetch("/api/upload/image", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || "Upload failed")
      }

      const { url } = await uploadRes.json()

      // 2. Update the channel record
      const updateRes = await fetch(`/api/channels/${channelSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [type]: url }),
      })

      if (!updateRes.ok) {
        throw new Error("Failed to update channel record")
      }

      onUpdate(url)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully!`)
    } catch (error: any) {
      toast.error(error.message || "Error updating branding")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className={cn("relative group", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          "flex items-center justify-center rounded-full glass-heavy border border-white/10 text-white shadow-xl hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn",
          type === "logo" ? "h-10 w-10" : "h-12 w-12"
        )}
        title={`Update ${type}`}
      >
        {isUploading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ImageIcon className="h-5 w-5 group-hover/btn:rotate-12 transition-transform" />
        )}
      </button>
    </div>
  )
}
