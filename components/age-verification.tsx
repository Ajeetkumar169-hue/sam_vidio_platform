"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export function AgeVerification() {
  const [verified, setVerified] = useState<boolean | null>(null)

  useEffect(() => {
    const v = localStorage.getItem("age-verified")
    setVerified(v === "true")
  }, [])

  if (verified === null) return null
  if (verified) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="mx-4 flex w-full max-w-md flex-col items-center rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-8 w-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Age Verification Required</h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          This website contains age-restricted content. By entering, you confirm that you are at least 18 years of age or the age of majority in your jurisdiction.
        </p>
        <div className="flex w-full flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={() => {
              localStorage.setItem("age-verified", "true")
              setVerified(true)
            }}
          >
            I am 18 or older - Enter
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              window.location.href = "https://www.google.com"
            }}
          >
            I am under 18 - Exit
          </Button>
        </div>
      </div>
    </div>
  )
}
