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
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) return

    // FOR TESTING: Clear any previous dismissal to ensure it shows for the user now
    // localStorage.removeItem("pwa-prompt-dismissed")

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Force show after a tiny delay for ALL mobile users
    const forceShowTimer = setTimeout(() => {
      // Only show if not already dismissed in this exact session
      if (!sessionStorage.getItem("pwa-dismissed-session")) {
         setIsVisible(true)
      }
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
        setDeferredPrompt(null)
        setIsVisible(false)
    } else {
        // iOS Manual Guide
        alert("SAM App Installation: \n\n1. Tap 'Share' button at bottom \n2. Scroll down & select 'Add to Home Screen' \n3. Tap 'Add' \n\nEnjoy the premium experience!")
        setIsVisible(false)
    }
  }

  const handleDismiss = (isPermanent = false) => {
    setIsVisible(false)
    if (isPermanent) {
       localStorage.setItem("pwa-prompt-dismissed", (Date.now() + 48 * 60 * 60 * 1000).toString())
    }
    sessionStorage.setItem("pwa-dismissed-session", "true")
  }

  if (!mounted || !isVisible) return null

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-black/90 backdrop-blur-3xl border border-white/20 p-6 shadow-[0_0_80px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 slide-in-from-bottom-20 duration-1000 ease-out">
      {/* Animated Accent Glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 bg-red-600/30 blur-[80px] rounded-full animate-pulse" />
      
      {/* Close Button (Cut) */}
      <button 
        onClick={() => handleDismiss(true)} 
        className="absolute top-5 right-5 h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all z-20"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex items-center gap-5">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-black p-2 flex items-center justify-center border border-white/10 shadow-xl">
                  <img src="/logo.png" alt="SAM" className="h-full w-full object-contain" />
                </div>
                <span className="logo-text text-3xl tracking-tighter" data-text="SAM">SAM</span>
              </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-2xl tracking-tighter text-white uppercase italic">Get the App</h3>
              <Sparkles className="h-5 w-5 text-red-600 animate-bounce" />
            </div>
            <p className="text-sm text-white/70 font-medium leading-relaxed">
              Install <span className="text-red-600 font-bold">SAM</span> for the fastest video experience.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
              <CheckCircle2 className="h-4 w-4 text-red-600 shrink-0" />
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">High Speed</span>
           </div>
           <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
              <Smartphone className="h-4 w-4 text-red-600 shrink-0" />
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest">Premium</span>
           </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button 
            onClick={handleInstall}
            className="relative w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black h-14 text-lg shadow-[0_10px_30px_-5px_rgba(220,38,38,0.5)] overflow-hidden group/btn active-bounce transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
            <Download className="h-6 w-6 mr-3" />
            INSTALL NOW
          </Button>
          
          <button 
            onClick={() => handleDismiss(false)} 
            className="w-full h-10 text-white/40 hover:text-white text-[11px] font-black uppercase tracking-[0.3em] transition-colors"
          >
            MAYBE LATER
          </button>
        </div>
      </div>
    </div>
  )
}
