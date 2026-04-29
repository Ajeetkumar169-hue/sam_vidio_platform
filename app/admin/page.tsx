"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Users, Film, AlertCircle, Eye, Tv } from "lucide-react"

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const statsRes = await fetch("/api/admin/stats").then(r => r.json())
      setStats(statsRes)
    } catch (err) {
      toast.error("Failed to fetch dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading || !stats) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard...</div>
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Admin Hub</h1>
        <p className="text-muted-foreground mt-2">Overview of your platform's health and activity.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { title: "Total Users", value: stats.users, icon: Users, color: "text-blue-500" },
          { title: "Channels", value: stats.channels || 0, icon: Tv, color: "text-indigo-500" },
          { title: "Total Videos", value: stats.videos, icon: Film, color: "text-purple-500" },
          { title: "Total Views", value: stats.totalViews, icon: Eye, color: "text-green-500" },
          { title: "Pending Videos", value: stats.pendingVideos, icon: AlertCircle, color: "text-orange-500" },
        ].map((s, i) => (
          <Card key={i} className="shadow-lg hover:shadow-xl transition-shadow border-primary/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium tracking-wider">{s.title}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Videos */}
        <Card className="shadow-xl flex flex-col">
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-x-auto platinum-scrollbar pb-6">
            {stats.recentVideos && stats.recentVideos.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Video</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.recentVideos.map((v: any) => (
                    <TableRow key={v._id}>
                        <TableCell className="font-medium truncate max-w-[200px]">{v.title}</TableCell>
                        <TableCell>
                          <Badge variant={v.status === 'approved' ? 'default' : v.status === 'pending' ? 'secondary' : 'destructive'}>
                            {v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {new Date(v.createdAt).toLocaleDateString()}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center py-4 text-muted-foreground">No recent videos</div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card className="shadow-xl flex flex-col">
          <CardHeader>
            <CardTitle>New Users</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-x-auto platinum-scrollbar pb-6">
            {stats.recentUsers && stats.recentUsers.length > 0 ? (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stats.recentUsers.map((u: any) => (
                    <TableRow key={u._id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-primary/10 border border-white/5 flex items-center justify-center font-bold text-primary">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.username} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-xs">{u.username.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium">{u.username}</div>
                                    <div className="text-xs text-muted-foreground">{u.email}</div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="capitalize text-sm">{u.role}</TableCell>
                        <TableCell>
                           <Badge variant={u.status === "active" ? "default" : "destructive"}>{u.status}</Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            ) : (
                <div className="text-center py-4 text-muted-foreground">No recent users</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
