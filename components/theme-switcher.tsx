"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Check, Moon, Sun, Palette, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const themes = [
  {
    id: "dark",
    name: "Obsidian",
    description: "Premium Dark",
    icon: Moon,
    color: "bg-slate-900",
    activeColor: "bg-primary"
  },
  {
    id: "white",
    name: "Pearl",
    description: "Clean Luxury",
    icon: Sun,
    color: "bg-white",
    activeColor: "bg-blue-600"
  },
  {
    id: "pink",
    name: "Satin",
    description: "Chic Rose",
    icon: Sparkles,
    color: "bg-pink-100",
    activeColor: "bg-pink-500"
  }
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-1 gap-2" role="radiogroup" aria-label="Select Appearance">
      {themes.map((t) => {
        const isActive = theme === t.id
        return (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            role="radio"
            aria-checked={isActive}
            className={cn(
              "relative flex flex-col sm:flex-row items-center justify-center sm:justify-between p-3 sm:p-4 rounded-2xl transition-all duration-500 group overflow-hidden border",
              isActive 
                ? "bg-primary/10 border-primary/30" 
                : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10"
            )}
          >
            {/* Background Accent Glow */}
            {isActive && (
              <div className="absolute inset-0 bg-primary/5 blur-xl animate-pulse" />
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 relative z-10 text-center sm:text-left">
              <div className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center transition-transform group-active:scale-95 shadow-lg flex-shrink-0",
                t.color,
                isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-transparent" : "border border-white/10"
              )}>
                <t.icon className={cn(
                  "h-5 w-5 sm:h-6 sm:w-6",
                  t.id === "white" ? "text-slate-900" : (t.id === "pink" ? "text-pink-600" : "text-white")
                )} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-foreground">
                  {t.name}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                  {t.description}
                </p>
              </div>
              <div className="block sm:hidden">
                 <p className="text-[10px] font-bold text-foreground uppercase tracking-wider">{t.name}</p>
              </div>
            </div>

            <div className={cn(
              "hidden sm:flex h-6 w-6 rounded-full items-center justify-center transition-all duration-500 ml-2",
              isActive ? "bg-primary scale-100 opacity-100" : "bg-white/10 scale-50 opacity-0"
            )}>
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
          </button>
        )
      })}
    </div>
  )
}
