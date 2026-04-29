"use client"

import Link from "next/link"
import { Menu, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
// ThemeSwitcher moved to sidebar
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { LogOut, Film, LayoutDashboard, Settings } from "lucide-react"

interface AdminHeaderProps {
  onMenuClick: () => void
  title?: string
}

export function AdminHeader({ onMenuClick, title = "Admin Console" }: AdminHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-[40] flex h-16 w-full items-center justify-between border-b border-border bg-background/60 px-6 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile Hamburger */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-foreground/50 hover:text-foreground"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Link href="/" className="logo-text text-xl lg:text-2xl tracking-tighter" data-text="SAM">
          SAM
        </Link>

        <div className="hidden lg:flex items-center gap-2 border-l border-border pl-4 ml-2 max-w-[200px] truncate">
          <Shield className="h-4 w-4 text-primary opacity-50 shrink-0" />
          <h1 className="text-sm font-bold text-foreground/60 tracking-tight uppercase whitespace-nowrap truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end text-right">
          <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{user?.username}</p>
          <p className="text-[10px] uppercase tracking-widest text-foreground/40">{user?.role}</p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 p-0 rounded-full border border-border hover:border-primary/50 transition-all overflow-hidden premium-shadow">
              {user?.avatar ? (
                  <img src={user.avatar} className="h-full w-full object-cover rounded-full" alt="Admin" />
              ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted">
                    <User className="h-4 w-4 text-foreground/30" />
                  </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-heavy border-border text-foreground rounded-2xl p-2 premium-shadow animate-in zoom-in-95 duration-200 luxury-easing">
            <div className="px-3 py-3 border-b border-border mb-1">
              <p className="text-sm font-bold truncate">{user?.username}</p>
              <p className="text-[10px] text-foreground/40 uppercase tracking-widest truncate">{user?.email}</p>
            </div>
            
            <DropdownMenuItem className="rounded-xl focus:bg-accent cursor-pointer py-2.5" onClick={() => router.push("/")}>
              <Film className="mr-3 h-4 w-4 text-foreground/40" />
              <span className="text-xs font-medium">View Website</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="rounded-xl focus:bg-accent cursor-pointer py-2.5" onClick={() => router.push("/dashboard")}>
              <LayoutDashboard className="mr-3 h-4 w-4 text-foreground/40" />
              <span className="text-xs font-medium">User Dashboard</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="rounded-xl focus:bg-accent cursor-pointer py-2.5" onClick={() => router.push("/settings")}>
              <Settings className="mr-3 h-4 w-4 text-foreground/40" />
              <span className="text-xs font-medium">Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-border my-1" />
            
            <DropdownMenuItem className="rounded-xl focus:bg-destructive/10 text-destructive focus:text-destructive cursor-pointer py-2.5" onClick={() => logout()}>
              <LogOut className="mr-3 h-4 w-4" />
              <span className="text-xs font-medium">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
