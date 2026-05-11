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
    
    // 1. Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) return

    // 2. Check if suppressed
    const dismissedUntil = localStorage.getItem("pwa-prompt-dismissed")
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return

    // 3. Listen for the native install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true) // Show immediately when the event fires
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // 4. Fallback: Show the popup ANYWAY after a tiny delay if not already shown
    // This handles iOS and other browsers that don't fire beforeinstallprompt
    const forceShowTimer = setTimeout(() => {
      setIsVisible(true)
    }, 1000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      clearTimeout(forceShowTimer)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        console.log(`User response to the install prompt: ${outcome}`)
        setDeferredPrompt(null)
        setIsVisible(false)
    } else {
        // iOS / Manual Install Guide
        alert("To Install: \n1. Tap 'Share' button \n2. Select 'Add to Home Screen' \n\nThen enjoy SAM Platform as a full App!")
        setIsVisible(false)
    }
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
      <div className="relative overflow-hidden rounded-[2.5rem] bg-black/80 backdrop-blur-3xl border border-white/10 p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 slide-in-from-bottom-10 duration-700 ease-out">
        
        {/* Animated Accent Glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-blue-500/10 blur-[80px] rounded-full" />
        
        {/* Close Button (Cut) */}
        <button 
          onClick={() => handleDismiss(2880)} 
          className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 shrink-0">
               <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
               <div className="relative h-full w-full rounded-2xl bg-gradient-to-br from-primary to-primary-foreground p-[1px] overflow-hidden shadow-2xl">
                 <div className="h-full w-full rounded-2xl bg-black flex items-center justify-center p-2">
                   <Image 
                     src="/logo.png" 
                     alt="SAM Logo" 
                     width={64} 
                     height={64}
                     className="w-full h-full object-contain"
                   />
                 </div>
               </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xl tracking-tighter text-white uppercase">Install SAM App</h3>
                <Sparkles className="h-4 w-4 text-primary animate-bounce" />
              </div>
              <p className="text-xs text-white/60 font-medium leading-relaxed">
                Add to home screen for a premium experience.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Fast Load</span>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Offline</span>
             </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleInstall}
              className="relative w-full rounded-xl bg-primary hover:bg-primary/90 text-white font-black h-12 text-base shadow-xl shadow-primary/20 overflow-hidden group/btn active-bounce"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </Button>
            
            <button 
              onClick={() => handleDismiss(2)} 
              className="w-full h-8 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
