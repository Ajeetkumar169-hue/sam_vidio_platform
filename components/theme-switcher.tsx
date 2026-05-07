"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Palette, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const themes = [
  { id: "dark", name: "Default Black", color: "#000000" },
  { id: "white", name: "Pearl White", color: "#ffffff" },
  { id: "pink", name: "Luxury Pink", color: "#ffc0cb" },
]

export function ThemeSwitcher({ variant = "dropdown" }: { variant?: "dropdown" | "inline" }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "w-full flex items-center justify-between gap-3 p-4 rounded-2xl transition-all duration-300 border",
              theme === t.id 
                ? "bg-primary/10 border-primary/20 text-primary shadow-lg shadow-primary/5" 
                : "bg-foreground/[0.02] border-transparent hover:bg-foreground/[0.05] text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-4">
              <div 
                className={cn(
                  "w-6 h-6 rounded-full border-2",
                  theme === t.id ? "border-primary/50" : "border-white/10"
                )}
                style={{ backgroundColor: t.color }}
              />
              <span className="font-bold text-sm">{t.name}</span>
            </div>
            {theme === t.id && (
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            )}
          </button>
        ))}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary">
          <Palette className="h-[1.2rem] w-[1.2rem] transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl glass-panel border-primary/10">
        <div className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Premium Themes
        </div>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center justify-between gap-2 p-2 rounded-xl cursor-pointer transition-all duration-200",
              theme === t.id ? "bg-primary/10 text-primary" : "hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full border border-white/10" 
                style={{ backgroundColor: t.color }}
              />
              <span className="font-medium">{t.name}</span>
            </div>
            {theme === t.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
