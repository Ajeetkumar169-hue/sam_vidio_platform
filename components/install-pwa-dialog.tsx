"use client"

import { useState, useEffect } from "react"
import { Download, X, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function InstallPwaDialog() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if already dismissed
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed")
    if (isDismissed) return

    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault()
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e)
      // Show our custom UI
      setTimeout(() => setIsVisible(true), 5000) // Show after 5 seconds
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    // Show the install prompt
    deferredPrompt.prompt()
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to the install prompt: ${outcome}`)
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem("pwa-prompt-dismissed", "true")
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] md:left-auto md:right-8 md:bottom-8 md:max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-background/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
        
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Zap className="h-7 w-7 text-white fill-current" />
          </div>
          
          <div className="space-y-1 pr-6">
            <h3 className="font-bold text-white text-lg">Install SAM App</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Experience the full video platform with faster loading and offline access.
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-3 relative">
          <Button 
            onClick={handleInstall}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold h-11"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Now
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="rounded-xl border-white/10 hover:bg-white/5 h-11"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  )
}
