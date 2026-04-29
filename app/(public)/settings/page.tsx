"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Settings, 
  User as UserIcon, 
  Shield, 
  Palette, 
  Bell, 
  Trash2, 
  Save, 
  Loader2,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { AvatarManagement } from "@/components/avatar-management"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useTheme } from "next-themes"

export default function SettingsPage() {
  const { user, isLoading, refresh } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()
  
  const [username, setUsername] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Nuclear Mobile Hardening: Dynamic Status Bar Color
  useEffect(() => {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      if (theme === 'white') themeColorMeta.setAttribute('content', '#fafafa')
      else if (theme === 'pink') themeColorMeta.setAttribute('content', '#fbe7ed')
      else themeColorMeta.setAttribute('content', '#1a1a2e')
    }
  }, [theme])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    if (user) {
      setUsername(user.username)
    }
  }, [user, isLoading, router])

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault()
    if (username === user?.username) return
    setIsSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })
      if (!res.ok) throw new Error("Failed to update username")
      toast.success("Username updated")
      refresh()
    } catch (error) {
      toast.error("Error updating username")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent px-6 py-12 animate-in fade-in duration-1000">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="space-y-2">
          <div className="flex items-center gap-3 text-primary">
            <Settings className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-[0.3em]">System Settings</span>
          </div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">Personalize your experience</h1>
          <p className="text-muted-foreground max-w-lg">Manage your identity, security preferences, and how others see you on SAM.</p>
        </header>

        {/* Modular Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Avatar & Identity */}
          <div className="lg:col-span-12 xl:col-span-8 space-y-8">
            
            {/* Avatar & Gallery Card */}
            <Card className="glass-panel border-0 premium-shadow-hover overflow-hidden transition-all duration-500 rounded-[2rem]">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div className="flex items-center gap-3 text-muted-foreground mb-1">
                  <UserIcon className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Identity</span>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">Visual Profile</CardTitle>
                <CardDescription className="text-muted-foreground">Set your primary display picture and manage your image gallery.</CardDescription>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8">
                <AvatarManagement />
              </CardContent>
            </Card>

          </div>

          {/* Right Column: Security & Appearance */}
          <div className="lg:col-span-12 xl:col-span-4 space-y-8">
            
            {/* Security Card */}
            <Card className="glass-panel border-0 premium-shadow rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 sm:p-8 pb-4">
                <div className="flex items-center gap-3 text-muted-foreground mb-1">
                  <Shield className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Protections</span>
                </div>
                <CardTitle className="text-xl font-bold text-foreground">Security</CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl glass-light hover:bg-foreground/5 cursor-pointer transition-colors group">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Change Password</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last updated 2 months ago</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl glass-light hover:bg-foreground/5 cursor-pointer transition-colors group">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Authentication</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Two-factor disabled</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>

            {/* Appearance Card */}
            <Card className="glass-panel border-0 premium-shadow rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 sm:p-8 pb-4">
                <div className="flex items-center gap-3 text-muted-foreground mb-1">
                  <Palette className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">UI Style</span>
                </div>
                <CardTitle className="text-xl font-bold text-foreground">Appearance</CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 pt-0">
                <ThemeSwitcher />
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <div className="p-6 sm:p-8 pt-0">
               <button className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-red-500/10 text-red-500/40 hover:text-red-500 hover:bg-red-500/5 hover:border-red-500/30 transition-all text-xs font-bold uppercase tracking-widest">
                  <Trash2 className="h-4 w-4" />
                  Deactivate Account
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
