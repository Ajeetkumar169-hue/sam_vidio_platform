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

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

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
