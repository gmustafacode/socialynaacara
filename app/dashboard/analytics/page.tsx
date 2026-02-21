"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, ArrowUpRight, Activity, Globe, Loader2, Eye, ThumbsUp, MessageSquare, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
// Import Recharts components
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{ totals: any, chartData: any[], history: any[] }>({
        totals: { views: 0, likes: 0, comments: 0, shares: 0, posts: 0 },
        chartData: [],
        history: []
    })

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/analytics')
                if (res.ok) {
                    const json = await res.json()
                    setData(json)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-purple-500" />
            </div>
        )
    }

    const { totals, chartData } = data

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-neutral-900 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                    <p className="text-white/60 text-xs font-bold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-[10px] font-black uppercase text-white/50" style={{ color: entry.color }}>
                                {entry.name}
                            </span>
                            <span className="text-sm font-bold text-white">{entry.value}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-white">Engagement Analytics</h2>
                    <p className="text-white/40 mt-1">Deep-dive into your content's real-world performance.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Live Metrics</span>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Impressions" value={totals.views} icon={Eye} color="text-amber-400" />
                <StatsCard title="Total Likes" value={totals.likes} icon={ThumbsUp} color="text-blue-400" />
                <StatsCard title="Comments" value={totals.comments} icon={MessageSquare} color="text-emerald-400" />
                <StatsCard title="Shares / Reposts" value={totals.shares} icon={Share2} color="text-purple-400" />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
                {/* Main Engagement Chart */}
                <Card className="lg:col-span-5 border-white/10 bg-neutral-900/50 backdrop-blur-md rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black">Performance Trend</CardTitle>
                                <CardDescription className="text-white/40">Engagement across recent posts</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-4 h-[400px]">
                        {chartData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-center">
                                <div className="space-y-3">
                                    <BarChart3 className="size-12 text-white/10 mx-auto" />
                                    <p className="text-white/30 text-sm font-medium">No analytics data yet</p>
                                </div>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="rgba(255,255,255,0.2)"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        minTickGap={30}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.2)"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="views" name="Impressions" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                                    <Area type="monotone" dataKey="likes" name="Likes" stroke="#60a5fa" strokeWidth={3} fillOpacity={1} fill="url(#colorLikes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Secondary Chart / Metric */}
                <Card className="lg:col-span-2 border-white/10 bg-neutral-900/50 backdrop-blur-md rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black">Interactions</CardTitle>
                        <CardDescription className="text-white/40">Comments & Shares</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 h-[300px]">
                        {chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                    <XAxis dataKey="date" hide />
                                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                    <Bar dataKey="comments" name="Comments" fill="#34d399" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="shares" name="Shares" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function StatsCard({ title, value, icon: Icon, color = "text-white" }: any) {
    return (
        <Card className="border-white/10 bg-neutral-900 rounded-3xl overflow-hidden relative group hover:border-white/20 transition-all">
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 bg-current", color)} />
            <CardContent className="p-8 flex items-center justify-between relative z-10">
                <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{title}</p>
                    <div className="flex items-baseline gap-3 mt-2">
                        <h3 className={cn("text-4xl font-black drop-shadow-lg", color)}>
                            {typeof value === 'number' && value > 999 ? `${(value / 1000).toFixed(1)}k` : value || 0}
                        </h3>
                    </div>
                </div>
                <div className={cn("p-4 rounded-2xl border border-white/5 bg-white/5", color)}>
                    <Icon className="size-6" />
                </div>
            </CardContent>
        </Card>
    )
}
