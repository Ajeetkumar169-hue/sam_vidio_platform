"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, ShieldCheck, ShieldAlert, Lock, Unlock } from "lucide-react"

export default function AdminRoles() {
    const roles = [
        {
            name: "Admin",
            description: "Full system access, user management, and financial data.",
            color: "bg-red-500",
            permissions: ["MANAGE_USERS", "MANAGE_VIDEOS", "VIEW_ANALYTICS", "MANAGE_STORAGE", "MANAGE_ROLES"],
            icon: ShieldCheck
        },
        {
            name: "Moderator",
            description: "Content moderation, report resolution, and video management.",
            color: "bg-blue-500",
            permissions: ["MANAGE_VIDEOS", "VIEW_REPORTS", "RESOLVE_REPORTS"],
            icon: Shield
        },
        {
            name: "User",
            description: "Standard platform access for viewing and uploading content.",
            color: "bg-green-500",
            permissions: ["UPLOAD_VIDEOS", "COMMENT", "LIKE"],
            icon: ShieldAlert
        }
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                <p className="text-muted-foreground">Define and manage system access levels.</p>
            </div>

            <div className="grid gap-6">
                {roles.map((role) => (
                    <Card key={role.name} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4 bg-muted/30">
                            <div className={`p-2 rounded-lg ${role.color}/10`}>
                                <role.icon className={`h-6 w-6 ${role.name === 'Admin' ? 'text-red-500' : role.name === 'Moderator' ? 'text-blue-500' : 'text-green-500'}`} />
                            </div>
                            <div className="flex-1">
                                <CardTitle>{role.name}</CardTitle>
                                <CardDescription>{role.description}</CardDescription>
                            </div>
                            <Badge variant="outline" className="ml-auto">Active</Badge>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Lock className="h-4 w-4" />
                                    Assigned Permissions
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {role.permissions.map((perm) => (
                                        <Badge key={perm} variant="secondary" className="font-mono text-[10px]">
                                            {perm}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="pt-4 border-t flex items-center justify-between text-xs text-muted-foreground italic">
                                    <span>Note: Permissions are currently hardcoded for security safety.</span>
                                    <span className="flex items-center gap-1">
                                        <Unlock className="h-3 w-3" />
                                        Immutable
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
