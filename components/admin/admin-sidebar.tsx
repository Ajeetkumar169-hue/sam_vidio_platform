"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Film,
    Users,
    AlertCircle,
    BarChart3,
    HardDrive,
    Settings,
    LogOut,
    Shield,
    Tv,
    Grid3X3,
    X,
    Moon,
    Sun,
    Sparkles,
    Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

interface AdminSidebarProps {
    role: string
    open?: boolean
    onClose?: () => void
}

export function AdminSidebar({ role, open, onClose }: AdminSidebarProps) {
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // Auto-close on route change for mobile
    useEffect(() => {
        if (open && onClose) {
           onClose()
        }
    }, [pathname])

    // Body scroll lock on mobile
    useEffect(() => {
        if (open) {
            document.body.classList.add("drawer-open")
        } else {
            document.body.classList.remove("drawer-open")
        }
        return () => document.body.classList.remove("drawer-open")
    }, [open])

    const links = [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
        { href: "/admin/videos", label: "Videos", icon: Film },
        { href: "/admin/categories", label: "Categories", icon: Grid3X3, disabled: role !== "admin" },
        { href: "/admin/channels", label: "Channels", icon: Tv, disabled: role !== "admin" },
        { href: "/admin/users", label: "Users", icon: Users, disabled: role !== "admin" },
        { href: "/admin/reports", label: "Reports", icon: AlertCircle },
        { href: "/admin/analytics", label: "Analytics", icon: BarChart3, disabled: role !== "admin" },
        { href: "/admin/storage", label: "Storage", icon: HardDrive, disabled: role !== "admin" },
        { href: "/admin/roles", label: "Roles & Permissions", icon: Shield, disabled: role !== "admin" },
    ]

    return (
        <>
            {/* Mobile Overlay */}
            {open && (
                <div 
                    className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-300" 
                    onClick={onClose}
                />
            )}

            <aside 
                className={cn(
                    "fixed left-0 top-0 z-[60] flex h-screen w-64 flex-col glass-heavy border-r-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "lg:sticky lg:translate-x-0 lg:z-auto platinum-scrollbar",
                    "contain-content [contain:layout_paint] [overscroll-behavior:contain]",
                    open ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
                )}
                style={{ height: '100vh', overflowY: 'auto' }}
            >
                <div className="flex h-16 flex-shrink-0 items-center justify-between px-6 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary active-glow" />
                        <span className="text-sm font-black uppercase tracking-widest text-foreground">System</span>
                    </div>
                    <Button variant="ghost" size="icon" className="lg:hidden text-foreground/40 hover:text-foreground hover:bg-foreground/10 h-10 w-10" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 space-y-1.5 p-4 scroll-smooth">
                    {links.map((link) => {
                        if (link.disabled) return null
                        const active = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                                    active
                                        ? "bg-primary/10 text-primary shadow-lg shadow-black/5 scale-[1.02]"
                                        : "text-foreground/40 hover:bg-accent hover:text-foreground"
                                )}
                            >
                                {active && <div className="active-indicator-line rounded-full" />}
                                <link.icon className={cn(
                                    "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                                    active && "active-glow"
                                )} />
                                {link.label}
                            </Link>
                        )
                    })}

                    {/* Theme / Appearance Section */}
                    <div className="pt-6 pb-2 px-4">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/30 mb-4 px-1">Appearance</h3>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { id: "dark", icon: Moon, label: "Obsidian" },
                                { id: "white", icon: Sun, label: "Pearl" },
                                { id: "pink", icon: Sparkles, label: "Satin" }
                            ].map((t) => {
                                const isActive = theme === t.id
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTheme(t.id)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 border",
                                            isActive 
                                                ? "bg-primary/10 border-primary/30 text-primary scale-[1.05] shadow-lg shadow-primary/10" 
                                                : "bg-muted/50 border-transparent text-foreground/40 hover:bg-muted hover:text-foreground hover:border-border"
                                        )}
                                    >
                                        <t.icon className={cn("h-4 w-4", isActive && "active-glow")} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">{t.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </nav>

                <div className="border-t border-border p-4 bg-accent/20">
                    <Link href="/">
                        <Button variant="ghost" className="w-full justify-start gap-4 h-12 rounded-xl text-foreground/50 hover:text-foreground hover:bg-accent" size="sm">
                            <LogOut className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Exit Console</span>
                        </Button>
                    </Link>
                </div>
            </aside>
        </>
    )
}
