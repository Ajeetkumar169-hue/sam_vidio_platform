"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Header } from "@/components/header"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileDrawer } from "@/components/mobile-drawer"
import { AgeVerification } from "@/components/age-verification"
import { cn } from "@/lib/utils"
import { SplashScreen } from "@/components/splash-screen"
import { InstallPwaDialog } from "@/components/install-pwa-dialog"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSplashDone, setIsSplashDone] = useState(false)
  
  // Desktop Sidebar States
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  
  // Mobile Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [hideNavs, setHideNavs] = useState(false)
  const pathname = usePathname()
  const isShorts = pathname === "/softporn"
  
  useEffect(() => {
    // Check if splash has already been shown in this session
    const hasShown = sessionStorage.getItem("splash_shown")
    if (hasShown) {
      setIsSplashDone(true)
    }

    const handleHide = (e: any) => setHideNavs(e.detail)
    window.addEventListener("toggle-navs", handleHide as any)
    return () => window.removeEventListener("toggle-navs", handleHide as any)
  }, [])

  const handleSplashComplete = () => {
    sessionStorage.setItem("splash_shown", "true")
    setIsSplashDone(true)
  }
  
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const openSidebarWithDelay = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) return
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    if (!openTimeoutRef.current && !sidebarOpen) {
      openTimeoutRef.current = setTimeout(() => {
        setSidebarOpen(true)
        openTimeoutRef.current = null
      }, 180)
    }
  }, [sidebarOpen])

  const cancelOpenRequest = useCallback(() => {
     if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current)
        openTimeoutRef.current = null
     }
  }, [])

  const closeSidebarWithDelay = useCallback(() => {
    if (sidebarPinned) return
    cancelOpenRequest()
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      setSidebarOpen(false)
      hideTimeoutRef.current = null
    }, 500)
  }, [sidebarPinned, cancelOpenRequest])

  const togglePin = useCallback(() => {
    setSidebarPinned(prev => !prev)
  }, [])

  return (
    <>
      {!isSplashDone && <SplashScreen onComplete={handleSplashComplete} />}
      <AgeVerification />
      
      {/* PWA Install Prompt - Higher Z-Index and only on Home Page */}
      {pathname === "/" && (
        <div className="fixed bottom-32 left-0 right-0 z-[10000] pointer-events-none flex justify-center">
          <div className="pointer-events-auto w-full max-w-md px-4">
             <InstallPwaDialog />
          </div>
        </div>
      )}
      
      <div className={cn(
        "flex h-screen flex-col relative overflow-hidden bg-background transition-opacity duration-500",
        isSplashDone ? "opacity-100" : "opacity-0 pointer-events-none"
      )}>
        
        {/* Invisible Hover Zone (Desktop Only) */}
        <div 
          className="fixed left-0 top-0 bottom-0 w-10 z-[60] hidden lg:block"
          onMouseEnter={openSidebarWithDelay}
          onMouseLeave={cancelOpenRequest}
        />

        <div className={cn(
          "transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] fixed top-0 left-0 right-0 z-[50]",
          (hideNavs || isShorts) ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}>
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        
        <div className="flex flex-1 overflow-hidden relative">
          <AppSidebar 
            open={sidebarOpen || sidebarPinned} 
            pinned={sidebarPinned}
            onTogglePin={togglePin}
            onClose={() => {
                setSidebarOpen(false)
                setSidebarPinned(false)
            }} 
            onMouseEnter={openSidebarWithDelay}
            onMouseLeave={closeSidebarWithDelay}
          />

          <main className={cn(
            "flex-1 overflow-y-auto platinum-scrollbar transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            sidebarPinned ? "lg:pl-64" : "",
            (hideNavs || isShorts) ? "pt-0" : "pt-16"
          )}>
            {children}
            <div className="h-28 lg:hidden" />
          </main>
        </div>

        {/* Mobile Navigation */}
        <div className={cn(
          "transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)] fixed bottom-0 left-0 right-0 z-[50] lg:hidden",
          hideNavs ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}>
          <MobileNav onMoreClick={() => setIsDrawerOpen(true)} />
        </div>
        <MobileDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      </div>
    </>
  )
}
