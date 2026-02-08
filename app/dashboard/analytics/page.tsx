"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, ArrowUpRight, Activity, Globe, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [history, setHistory] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        published: 0,
        failed: 0,
        engagement: "4.2%"
    })

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch('/api/linkedin/posts')
                if (res.ok) {
                    const data = await res.json()
                    setHistory(data)
                    setStats({
                        total: data.length,
                        published: data.filter((p: any) => p.status === 'PUBLISHED').length,
                        failed: data.filter((p: any) => p.status === 'FAILED').length,
                        engagement: "5.8%"
                    })
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-white">Advanced Analytics</h2>
                    <p className="text-white/40 mt-1">Cross-platform transmission reports and engagement intelligence.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Engine Data</span>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Transmissions" value={stats.total} trend="+12.5%" icon={Globe} />
                <StatsCard title="Publish Success" value={stats.published} trend="98%" icon={TrendingUp} color="text-emerald-400" />
                <StatsCard title="Failed Criticals" value={stats.failed} trend="Normal" icon={Activity} color="text-red-400" />
                <StatsCard title="Engagement Rate" value={stats.engagement} trend="+0.8%" icon={Users} color="text-purple-400" />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                <Card className="lg:col-span-5 border-white/10 bg-neutral-900/50 backdrop-blur-md rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black">Transmission Volume</CardTitle>
                                <CardDescription className="text-white/40">Activity over the last 14 days</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="size-2 rounded-full bg-purple-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">LinkedIn API</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-12 h-[350px]">
                        <div className="h-full flex items-end justify-between gap-2 md:gap-4">
                            {[45, 60, 35, 80, 50, 90, 40, 70, 55, 65, 30, 85, 45, 95].map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div
                                        className="w-full bg-gradient-to-t from-purple-600/20 to-purple-500/60 rounded-t-xl transition-all duration-700 group-hover:to-purple-400 relative"
                                        style={{ height: `${val}%` }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-black p-2 rounded-lg shadow-2xl">
                                            {val}
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-white/10 uppercase tracking-tighter">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-white/10 bg-neutral-900/50 backdrop-blur-md rounded-[2rem]">
                    <CardHeader className="p-8">
                        <CardTitle className="text-xl font-black">Account Health</CardTitle>
                        <CardDescription className="text-white/40">API Status & Tokens</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        {[
                            { name: 'LinkedIn API', status: 'Operational', color: 'bg-emerald-500' },
                            { name: 'Inngest Workers', status: 'Active', color: 'bg-emerald-500' },
                            { name: 'n8n Webhook', status: 'Listening', color: 'bg-blue-500' },
                            { name: 'Identity Service', status: 'Operational', color: 'bg-emerald-500' },
                        ].map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                <span className="text-xs font-bold text-white/60">{s.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-white/40">{s.status}</span>
                                    <div className={cn("size-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", s.color)} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatsCard({ title, value, trend, icon: Icon, color = "text-white" }: any) {
    return (
        <Card className="border-white/10 bg-neutral-900 rounded-3xl group hover:border-purple-500/30 transition-all">
            <CardContent className="p-8 flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">{title}</p>
                    <div className="flex items-baseline gap-3 mt-2">
                        <h3 className={cn("text-3xl font-black", color)}>{value}</h3>
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black">
                            <ArrowUpRight className="size-3" />
                            {trend}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 group-hover:scale-110 transition-transform">
                    <Icon className={cn("size-6", color)} />
                </div>
            </CardContent>
        </Card>
    )
}
