"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { HardDrive, Cloud, AlertCircle, Trash2, PieChart } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export default function AdminStorage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/storage")
            .then(res => res.json())
            .then(d => {
                setData(d.usage)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div>Analyzing storage...</div>

    const storageUsedGb = data?.storage?.usage ? (data.storage.usage / (1024 * 1024 * 1024)).toFixed(2) : "0.00"
    const storageLimitGb = data?.storage?.limit ? (data.storage.limit / (1024 * 1024 * 1024)).toFixed(2) : "0.00"

    return (
        <div className="space-y-8">
            <div className="space-y-2 sm:space-y-0">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Storage Management</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Monitor Cloudinary usage and bandwidth consumption.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 order-2 md:order-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cloud className="h-5 w-5 text-blue-500" />
                            Cloudinary Storage
                        </CardTitle>
                        <CardDescription>Overall storage occupancy across the platform assets.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">{storageUsedGb} GB Used</span>
                                <span className="text-muted-foreground">of {storageLimitGb === "0.00" ? "Unlimited" : `${storageLimitGb} GB`}</span>
                            </div>
                            <Progress value={data?.storage?.used_percent || 0} className="h-4" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Total Objects</p>
                                <p className="text-xl font-bold">{data?.objects?.usage || 0}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase">Bandwidth Used</p>
                                <p className="text-xl font-bold">{(data?.bandwidth?.usage / (1024 * 1024 * 1024) || 0).toFixed(2)} GB</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="order-1 md:order-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Storage Health
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                            <p className="text-xs text-orange-700 font-medium">Warning: Asset Overhead</p>
                            <p className="text-[10px] text-orange-600 mt-1">Detected multiple derivative assets that could be optimized.</p>
                        </div>
                        <Button variant="outline" className="w-full gap-2 text-xs" size="sm">
                            <Trash2 className="h-4 w-4" />
                            Clean Unused Assets
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-indigo-500" />
                        Asset Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-8 sm:gap-12 justify-center py-6 sm:py-8">
                        {[
                            { label: "Original Videos", color: "bg-indigo-500", percent: 75 },
                            { label: "Thumbnails", color: "bg-blue-400", percent: 15 },
                            { label: "Transcoded Versions", color: "bg-cyan-300", percent: 10 },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col items-center gap-3">
                                <div className={`w-24 h-24 rounded-full border-[10px] border-muted flex items-center justify-center relative overflow-hidden`}>
                                    <div
                                        className={`absolute bottom-0 left-0 w-full ${item.color} transition-all duration-1000`}
                                        style={{ height: `${item.percent}%` }}
                                    />
                                    <span className="font-bold text-sm relative z-10">{item.percent}%</span>
                                </div>
                                <span className="text-xs font-medium">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
