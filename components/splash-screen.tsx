"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Start animation slightly after mount
    const timer1 = setTimeout(() => setIsAnimating(true), 100)
    
    // Hide splash screen after 3 seconds
    const timer2 = setTimeout(() => {
        setIsVisible(false)
        sessionStorage.setItem("splash-shown", "true")
    }, 3000)

    // Don't show if already shown in this session
    if (sessionStorage.getItem("splash-shown")) {
        setIsVisible(false)
    }

    return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0F0F19] transition-opacity duration-700 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Animated Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo Animation */}
        <div className={`h-32 w-32 rounded-[32px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 transition-all duration-1000 transform ${isAnimating ? 'scale-100 rotate-0' : 'scale-50 rotate-12'}`}>
           <Zap className="h-16 w-16 text-white fill-current" />
        </div>

        {/* Text Animation */}
        <div className="flex flex-col items-center gap-2">
            <h1 className={`text-4xl md:text-6xl font-black text-white tracking-tighter transition-all duration-1000 delay-300 transform ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
                Welcome to <span className="text-primary italic">SAM</span>
            </h1>
            <p className={`text-muted-foreground font-medium tracking-widest uppercase text-xs transition-all duration-1000 delay-500 transform ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                Premium Video Platform
            </p>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-20 flex flex-col items-center gap-4">
          <div className="h-1 w-48 bg-white/10 rounded-full overflow-hidden">
              <div className={`h-full bg-primary transition-all duration-[2500ms] ease-out ${isAnimating ? 'w-full' : 'w-0'}`} />
          </div>
      </div>
    </div>
  )
}
