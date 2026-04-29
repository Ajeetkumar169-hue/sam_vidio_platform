"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Bell, BellRing } from "lucide-react"
import { cn } from "@/lib/utils"

interface SubscribeButtonProps {
  channelSlug: string
  initialSubscribed?: boolean
  initialSubscriberCount?: number
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showCount?: boolean
}

export function SubscribeButton({
  channelSlug,
  initialSubscribed = false,
  initialSubscriberCount = 0,
  variant,
  size = "default",
  className,
  showCount = true
}: SubscribeButtonProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed)
  const [count, setCount] = useState(initialSubscriberCount)
  const [loading, setLoading] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  // Check current status on mount
  useEffect(() => {
    if (user && channelSlug) {
      setIsChecking(true)
      fetch(`/api/channels/${channelSlug}/subscribe`)
        .then((r) => r.json())
        .then((d) => {
          setIsSubscribed(d.subscribed)
        })
        .catch(() => {})
        .finally(() => setIsChecking(false))
    } else {
      setIsChecking(false)
    }
  }, [user, channelSlug])

  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push("/login")
      return
    }

    setLoading(true)
    // Optimistic Update
    const prevSubscribed = isSubscribed
    setIsSubscribed(!prevSubscribed)
    setCount(prev => prevSubscribed ? Math.max(0, prev - 1) : prev + 1)

    try {
      const res = await fetch(`/api/channels/${channelSlug}/subscribe`, { method: "POST" })
      const data = await res.json()
      
      if (res.ok) {
        setIsSubscribed(data.subscribed)
        toast.success(data.subscribed ? "Subscribed!" : "Unsubscribed")
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      // Revert on error
      setIsSubscribed(prevSubscribed)
      setCount(prev => prevSubscribed ? prev + 1 : Math.max(0, prev - 1))
      toast.error("Failed to update subscription")
    } finally {
      setLoading(false)
    }
  }, [user, channelSlug, isSubscribed, router])

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Button
        variant={variant || (isSubscribed ? "secondary" : "default")}
        size={size}
        onClick={handleToggle}
        disabled={loading || isChecking}
        className={cn(
          "relative overflow-hidden transition-all duration-300 rounded-full font-bold",
          !isSubscribed && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20",
          isSubscribed && "bg-secondary text-foreground hover:bg-secondary/80",
          loading && "opacity-80"
        )}
      >
        <div className="flex items-center gap-2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isSubscribed ? (
            <BellRing className="h-4 w-4 fill-current" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          <span>{isSubscribed ? "Subscribed" : "Subscribe"}</span>
        </div>
        
        {/* Subtle highlight effect */}
        {!isSubscribed && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        )}
      </Button>
      
      {showCount && (
        <span className="text-[10px] text-center text-muted-foreground font-medium uppercase tracking-wider opacity-60">
          {formatCount(count)} subscribers
        </span>
      )}
    </div>
  )
}
