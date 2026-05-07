"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Header } from "@/components/header"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { MobileDrawer } from "@/components/mobile-drawer"
import { AgeVerification } from "@/components/age-verification"
import { cn } from "@/lib/utils"

export function AppShell({ children }: { children: React.ReactNode }) {
  // Desktop Sidebar States
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  
  // Mobile Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [hideNavs, setHideNavs] = useState(false)
  
  useEffect(() => {
    const handleHide = (e: any) => setHideNavs(e.detail)
    window.addEventListener("toggle-navs", handleHide as any)
    return () => window.removeEventListener("toggle-navs", handleHide as any)
  }, [])
  
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const openSidebarWithDelay = useCallback(() => {
    // Only trigger on desktop to avoid mobile conflicts
    if (typeof window !== "undefined" && window.innerWidth < 1024) return

    // Clear any pending close timeouts
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    // Set 180ms open delay for premium intentional feel
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
    // If pinned, don't close
    if (sidebarPinned) return

    cancelOpenRequest()

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current)
    hideTimeoutRef.current = setTimeout(() => {
      setSidebarOpen(false)
      hideTimeoutRef.current = null
    }, 500) // 500ms luxury delay for desktop
  }, [sidebarPinned, cancelOpenRequest])

  const togglePin = useCallback(() => {
    setSidebarPinned(prev => !prev)
  }, [])

  return (
    <>
      <AgeVerification />
      
      <div className="flex h-screen flex-col relative overflow-hidden bg-background">
        
        {/* --- DESKTOP NAVIGATION --- */}
        {/* Invisible Hover Zone (Desktop Only) - Trigger Zone: 40px left edge */}
        <div 
          className="fixed left-0 top-0 bottom-0 w-10 z-[60] hidden lg:block"
          onMouseEnter={openSidebarWithDelay}
          onMouseLeave={cancelOpenRequest}
        />

        <div className={cn(
          "transition-transform duration-300 fixed top-0 left-0 right-0 z-[50]",
          hideNavs ? "-translate-y-full" : "translate-y-0"
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
            sidebarPinned ? "lg:pl-64" : ""
          )}>
            {children}
            
            {/* Spacer for Mobile Bottom Nav */}
            <div className="h-28 lg:hidden" />
          </main>
        </div>

        {/* --- MOBILE NAVIGATION --- */}
        <div className={cn(
          "transition-transform duration-300 fixed bottom-0 left-0 right-0 z-[50] lg:hidden",
          hideNavs ? "translate-y-full" : "translate-y-0"
        )}>
          <MobileNav onMoreClick={() => setIsDrawerOpen(true)} />
        </div>
        <MobileDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      </div>
    </>
  )
}

