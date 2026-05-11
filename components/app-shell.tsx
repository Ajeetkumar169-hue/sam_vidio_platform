"use client"

import { useState, useEffect } from "react"
import { SplashScreen } from "@/components/splash-screen"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSplashDone, setIsSplashDone] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem("splash-shown")) {
      setIsSplashDone(true)
    }
  }, [])

  return (
    <>
      {!isSplashDone && <SplashScreen onComplete={() => setIsSplashDone(true)} />}
      <div className={`transition-opacity duration-500 ${isSplashDone ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </>
  )
}
