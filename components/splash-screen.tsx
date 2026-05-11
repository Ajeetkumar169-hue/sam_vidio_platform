"use client"

import { useState, useEffect } from "react"
import { Zap } from "lucide-react"
import { useTheme } from "next-themes"

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  const { theme } = useTheme()
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  useEffect(() => {
    // Check if already shown in this session
    if (sessionStorage.getItem("splash-shown")) {
        setIsVisible(false)
        onComplete?.()
        return
    }

    // Start animation immediately
    setIsAnimating(true)
    
    // Start fading out after 2.5 seconds
    const timer1 = setTimeout(() => {
        setIsEnding(true)
    }, 2500)

    // Complete after 3 seconds
    const timer2 = setTimeout(() => {
        setIsVisible(false)
        sessionStorage.setItem("splash-shown", "true")
        onComplete?.()
    }, 3200)

    return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
    }
  }, [onComplete])

  if (!isVisible) return null

  // Theme based colors
  const bgColors: Record<string, string> = {
    dark: "#0F0F19",
    light: "#F8FAFC",
    white: "#FFFFFF",
    pink: "#FFF1F2"
  }
  
  const currentBg = bgColors[theme || "dark"] || "#0F0F19"
  const isLight = theme === "light" || theme === "white" || theme === "pink"

  return (
    <div 
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center transition-all duration-700 ${isEnding ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}
      style={{ backgroundColor: currentBg }}
    >
      {/* Animated Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] transition-all duration-1000 ${isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} />
      </div>

      <div className="relative flex flex-col items-center gap-10">
        {/* Logo Animation */}
        <div className={`h-36 w-36 rounded-[40px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 transition-all duration-1000 transform ${isAnimating ? 'scale-100 rotate-0' : 'scale-0 -rotate-12'}`}>
           <Zap className="h-20 w-20 text-white fill-current animate-pulse" />
        </div>

        {/* Text Animation */}
        <div className="flex flex-col items-center gap-3">
            <div className="overflow-hidden">
                <h1 className={`text-5xl md:text-7xl font-black tracking-tighter transition-all duration-1000 delay-300 transform ${isAnimating ? 'translate-y-0' : 'translate-y-full'} ${isLight ? 'text-black' : 'text-white'}`}>
                    Welcome to <span className="text-primary italic">SAM</span>
                </h1>
            </div>
            <p className={`font-bold tracking-[0.3em] uppercase text-[10px] md:text-xs transition-all duration-1000 delay-500 transform ${isAnimating ? 'opacity-100' : 'opacity-0'} ${isLight ? 'text-muted-foreground' : 'text-white/40'}`}>
                Premium Video Experience
            </p>
        </div>
      </div>

      {/* Modern Loading Line */}
      <div className="absolute bottom-24 w-64 h-[2px] bg-primary/10 rounded-full overflow-hidden">
          <div className={`h-full bg-primary transition-all duration-[2800ms] ease-in-out ${isAnimating ? 'w-full' : 'w-0'}`} />
      </div>
    </div>
  )
}
