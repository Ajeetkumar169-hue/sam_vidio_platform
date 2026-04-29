"use client"

import { ReactNode, useState, useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        if (!isLoading && (!user || user.role !== "admin")) {
            router.push("/")
        }
    }, [user, isLoading, router])

    if (isLoading || !user || user.role !== "admin") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background text-foreground relative overflow-hidden transition-colors duration-300 no-horizontal-shift">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <AdminSidebar 
                role={user.role} 
                open={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
            />

            <div className="flex flex-1 flex-col relative overflow-hidden no-horizontal-shift">
                <AdminHeader 
                    onMenuClick={() => setSidebarOpen(true)} 
                    title={pathname.split('/').pop()?.replace(/-/g, ' ') || "Dashboard"}
                />

                <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-8 lg:py-12 platinum-scrollbar relative">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
