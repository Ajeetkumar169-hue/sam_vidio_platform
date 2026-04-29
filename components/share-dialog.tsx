"use client"

import { useState } from "react"
import { Share2, Facebook, Twitter, MessageCircle, Instagram, Copy, Check, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ShareDialogProps {
  videoId: string
  title: string
  description?: string
  className?: string
}

export function ShareDialog({ videoId, title, description = "", className }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  // Use absolute URL from window on client
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/watch/${videoId}` : ""
  
  const handleNativeShare = async () => {
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: title,
          text: description.slice(0, 100),
          url: shareUrl,
        })
        toast.success("Shared successfully")
      } catch (err) {
        // Fallback to custom dialog if user cancelled or it failed
        if ((err as Error).name !== 'AbortError') {
          setOpen(true)
        }
      }
    } else {
      setOpen(true)
    }
  }

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea")
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-[#25D366]",
      href: `https://wa.me/?text=${encodeURIComponent(title + " " + shareUrl)}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      color: "bg-black",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
    },
  ]

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className={cn("gap-2 w-full sm:w-auto active-bounce", className)} 
        onClick={handleNativeShare}
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md glass-panel rounded-3xl border-foreground/5 p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Share this video</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose your preferred platform or copy the link below.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-around py-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 transition-transform active:scale-90"
              >
                <div className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl transition-all group-hover:-translate-y-1 shadow-black/10",
                  social.color
                )}>
                  <social.icon className="h-7 w-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground">
                  {social.name}
                </span>
              </a>
            ))}
            {/* Instagram Informational Only (Unreliable for deep-linking) */}
            <div className="flex flex-col items-center gap-3 opacity-50 grayscale cursor-help" title="Instagram is manual use only">
               <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
                  <Instagram className="h-7 w-7" />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Instagram</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                readOnly
                value={shareUrl}
                className="h-14 pr-24 rounded-2xl border-foreground/10 bg-secondary/30 focus-visible:ring-primary/20 font-mono text-xs"
              />
              <Button
                size="sm"
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10 px-4 min-w-[80px]"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2 font-bold uppercase text-[10px] tracking-widest">{copied ? "Copied" : "Copy"}</span>
              </Button>
            </div>
            
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-2 italic">
               <Info className="h-3 w-3" />
               Facebook previews are metadata-cached (may take a moment to update).
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
