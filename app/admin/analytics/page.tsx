"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Film, ArrowUpRight, ArrowDownRight, Eye } from "lucide-react"

export default function AdminAnalytics() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div>Loading insights...</div>

    const growth = data?.growth || []

    return (
        <div className="space-y-8">
            <div className="space-y-2 sm:space-y-0 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Platform Analytics</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Deep dive into platform growth and usage patterns.</p>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
                {growth.map((item: any, id: number) => (
                    <Card key={id}>
                        <CardContent className="p-4 sm:p-6">
                            <p className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase sm:normal-case">{item.label}</p>
                            <div className="mt-1 sm:mt-2 flex items-center justify-between">
                                <span className="text-lg sm:text-2xl font-bold">{item.value}</span>
                                {item.positive ? (
                                    <ArrowUpRight className="h-5 w-5 text-green-500" />
                                ) : (
                                    <ArrowDownRight className="h-5 w-5 text-red-500" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-lg border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Film className="h-5 w-5 text-primary" />
                            Upload Frequency (Last 14 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-end gap-2 pr-4 pt-4">
                            {(data?.uploadsByDay || []).map((day: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-primary/80 rounded-t group-hover:bg-primary transition-all cursor-help relative"
                                        style={{ height: `${Math.max(day.count * 10, 5)}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {day.count} uploads on {day._id}
                                        </div>
                                    </div>
                                    <span className="text-[10px] rotate-45 md:rotate-0 text-muted-foreground mt-2 truncate max-w-full">
                                        {day._id.split("-").slice(1).join("-")}
                                    </span>
                                </div>
                            ))}
                            {(!data?.uploadsByDay || data.uploadsByDay.length === 0) && (
                                <p className="w-full text-center text-muted-foreground pb-20">Insufficient data for chart</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Storage Growth (Last 14 Days)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] flex items-end gap-2 pr-4 pt-4">
                            {(data?.storageByDay || []).map((day: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div
                                        className="w-full bg-blue-500/80 rounded-t group-hover:bg-blue-500 transition-all cursor-help relative"
                                        style={{ height: `${Math.max((day.size / (1024 * 1024 * 1024)) * 10, 5)}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            {(day.size / (1024 * 1024)).toFixed(1)} MB on {day._id}
                                        </div>
                                    </div>
                                    <span className="text-[10px] rotate-45 md:rotate-0 text-muted-foreground mt-2 truncate max-w-full">
                                        {day._id.split("-").slice(1).join("-")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-lg border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            User Engagement Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6 pt-4">
                            {(data?.engagement || []).map((stat: any, i: number) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{stat.label}</span>
                                        <span className="font-semibold">{stat.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary/70 transition-all duration-1000" style={{ width: `${stat.value}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-primary/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Grid3X3 className="h-5 w-5 text-primary" />
                            Top Performing Categories
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 pt-2">
                            {(data?.topCategories || []).map((cat: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{cat.name}</span>
                                        <span className="text-[10px] text-muted-foreground uppercase">{cat.count} Videos</span>
                                    </div>
                                    <Badge variant="secondary" className="gap-1">
                                        <Eye className="h-3 w-3" />
                                        {cat.views}
                                    </Badge>
                                </div>
                            ))}
                            {(!data?.topCategories || data.topCategories.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center py-10">No data available yet</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function Grid3X3(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M3 15h18" />
      <path d="M9 3v18" />
      <path d="M15 3v18" />
    </svg>
  )
}
