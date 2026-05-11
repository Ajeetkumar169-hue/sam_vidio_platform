"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"

export function OfflineDetector() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handleOffline = () => {
      toast.error("You are offline. Switching to Downloads.", {
        duration: 5000,
      })
      if (pathname !== "/downloads") {
        router.push("/downloads")
      }
    }

    const handleOnline = () => {
      toast.success("You are back online!")
    }

    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)

    // Check initial state
    if (!navigator.onLine && pathname !== "/downloads") {
        router.push("/downloads")
    }

    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [pathname, router])

  return null
}
