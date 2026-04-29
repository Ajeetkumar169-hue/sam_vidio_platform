"use client"

import { useState, useEffect } from "react"
import { Bell, Shield, Info, AlertTriangle, CheckCircle2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export function AdminNotifications() {
    const [notifications, setNotifications] = useState<any[]>([
        { id: 1, type: 'report', message: 'New user report on video #42', time: '2m ago', icon: AlertTriangle, color: 'text-orange-500' },
        { id: 2, type: 'system', message: 'Storage usage reached 75%', time: '1h ago', icon: Info, color: 'text-blue-500' },
        { id: 3, type: 'security', message: 'Admin login from new IP', time: '3h ago', icon: Shield, color: 'text-red-500' },
        { id: 4, type: 'success', message: 'Weekly analytics report ready', time: '5h ago', icon: CheckCircle2, color: 'text-green-500' }
    ])

    const [unreadCount, setUnreadCount] = useState(notifications.length)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl">
                <DropdownMenuLabel className="p-4 flex items-center justify-between">
                    <span>System Notifications</span>
                    <span className="text-[10px] font-normal bg-muted px-2 py-0.5 rounded-full">{unreadCount} New</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="m-0" />
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((n) => (
                        <DropdownMenuItem key={n.id} className="p-4 focus:bg-muted cursor-pointer">
                            <div className="flex gap-4">
                                <div className={`mt-1 p-2 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                                    <n.icon className={`h-4 w-4 ${n.color}`} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{n.message}</p>
                                    <p className="text-[10px] text-muted-foreground">{n.time}</p>
                                </div>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </div>
                <DropdownMenuSeparator className="m-0" />
                <div className="p-2">
                    <Button variant="ghost" className="w-full text-xs h-8 text-muted-foreground hover:text-primary" onClick={() => setUnreadCount(0)}>
                        Mark all as read
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
