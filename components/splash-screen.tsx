"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  useEffect(() => {
    // Start animation immediately
    setIsAnimating(true)
    
    // Start fading out after 2.5 seconds
    const timer1 = setTimeout(() => {
        setIsEnding(true)
    }, 2500)

    // Complete after 3.2 seconds
    const timer2 = setTimeout(() => {
        setIsVisible(false)
        onComplete?.()
    }, 3200)

    return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
    }
  }, [onComplete])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-[99999] flex flex-col items-center justify-start pt-12 md:pt-24 bg-[#0F0F19] transition-all duration-700 ease-in-out ${isEnding ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Animated Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-red-600/20 rounded-full blur-[80px] md:blur-[120px] transition-all duration-1000 ${isAnimating ? 'scale-125 opacity-100' : 'scale-50 opacity-0'}`} />
      </div>

      <div className="relative flex flex-col items-center gap-10 md:gap-14 px-6 text-center">
        <div className={`flex flex-col items-center justify-center gap-2 transition-all duration-1000 transform ${isAnimating ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-3xl bg-black flex items-center justify-center p-4 shadow-2xl border border-white/10 mb-4 animate-active-bounce">
                <img src="/logo.png" alt="SAM" className="h-full w-full object-contain" />
            </div>
            <span className="logo-text text-6xl md:text-8xl tracking-tighter" data-text="SAM">SAM</span>
        </div>

        {/* Text Animation */}
        <div className="flex flex-col items-center gap-4">
            <div className="overflow-hidden">
                <h1 className={`text-4xl md:text-7xl font-black text-white tracking-tight transition-all duration-1000 delay-300 transform ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                    ENJOY YOUR <span className="text-red-600 italic">LIFE</span>
                </h1>
            </div>
            <p className={`text-white/40 font-bold tracking-[0.4em] uppercase text-[9px] md:text-xs transition-all duration-1000 delay-500 transform ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                Premium Video Experience
            </p>
        </div>
      </div>

      {/* Loading Line */}
      <div className="absolute bottom-20 md:bottom-24 w-48 md:w-64 h-[3px] bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div className={`h-full bg-red-600 transition-all duration-[2800ms] ease-out ${isAnimating ? 'w-full' : 'w-0'}`} />
      </div>
    </div>
  )
}
