"use client"

import { useState, useEffect } from "react"
import { Download, X, Sparkles, Smartphone, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function InstallPwaDialog() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if already dismissed
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed")
    if (isDismissed) return

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Show our custom UI almost immediately for a strong first impression
      const timer = setTimeout(() => setIsVisible(true), 1500) 
      return () => clearTimeout(timer)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Fallback: If the browser doesn't support the prompt (iOS Safari etc), 
    // we still show it after a delay to explain how to add to home screen
    const fallbackTimer = setTimeout(() => {
        if (!isVisible && !localStorage.getItem("pwa-prompt-dismissed")) {
            setIsVisible(true)
        }
    }, 5000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      clearTimeout(fallbackTimer)
    }
  }, [isVisible])

  const handleInstall = async () => {
    if (deferredPrompt) {
        // Show the install prompt
        deferredPrompt.prompt()
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null)
    } else {
        // Fallback for iOS/Other: Show instructions or just toast
        alert("To install: Tap the share button and select 'Add to Home Screen'")
    }
    setIsVisible(false)
  }

  const handleDismiss = (durationInMinutes: number = 1440) => {
    setIsVisible(false)
    const expiry = Date.now() + durationInMinutes * 60 * 1000
    localStorage.setItem("pwa-prompt-dismissed", expiry.toString())
  }

  if (!mounted || !isVisible) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[9999] md:left-auto md:right-8 md:bottom-8 md:max-w-md">
      {/* Premium Animated Container */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-black/60 backdrop-blur-3xl border border-white/10 p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-1000 ease-out group">
        
        {/* Animated Accent Glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-blue-500/10 blur-[80px] rounded-full" />
        
        {/* Close Button (Cut) */}
        <button 
          onClick={() => handleDismiss(2880)} // Close/Cut suppresses for 48 hours (2880 minutes)
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 flex flex-col gap-6">
          {/* Header with Logo & Brand */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
               <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
               <div className="relative h-full w-full rounded-3xl bg-gradient-to-br from-primary to-primary-foreground p-[1px] overflow-hidden shadow-2xl">
                 <div className="h-full w-full rounded-3xl bg-black flex items-center justify-center p-2">
                   <Image 
                     src="/logo.png" 
                     alt="SAM Logo" 
                     width={64} 
                     height={64}
                     className="w-full h-full object-contain"
                   />
                 </div>
               </div>
               <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-black shadow-lg">
                  <Smartphone className="h-3.5 w-3.5 text-white" />
               </div>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-2xl tracking-tighter text-white uppercase">Install App</h3>
                <Sparkles className="h-4 w-4 text-primary animate-bounce" />
              </div>
              <p className="text-sm text-white/60 font-medium leading-relaxed">
                Add <span className="text-primary font-bold">SAM Platform</span> to your home screen for a premium, lightning-fast experience.
              </p>
            </div>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-3">
             <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Fast Load</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Offline View</span>
             </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleInstall}
              className="relative w-full rounded-2xl bg-primary hover:bg-primary/90 text-white font-black h-14 text-lg shadow-xl shadow-primary/20 overflow-hidden group/btn active-bounce"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              <Download className="h-5 w-5 mr-3 group-hover/btn:scale-110 transition-transform" />
              Install Now
            </Button>
            
            <button 
              onClick={() => handleDismiss(2)} // Maybe Later suppresses for only 2 minutes
              className="w-full h-10 text-white/40 hover:text-white text-xs font-black uppercase tracking-[0.2em] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
