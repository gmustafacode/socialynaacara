"use client"

import Link from "next/link";
import { useEffect, useState } from "react";
import { Share2, Layers, Sparkles, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlatformPolicyCard } from "@/components/PlatformPolicyCard";
import { AiGeneratedContentPlaceholder } from "@/components/AiGeneratedContentPlaceholder";
import { cn } from "@/lib/utils";
import { SystemStatus } from "@/components/SystemStatus"

export default function DashboardPage() {
    const [stats, setStats] = useState({
        accountsCount: 0,
        pendingContent: 0,
        aiLogsCount: 0,
        engagement: "0%"
    })
    const [postHistory, setPostHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch connected accounts
                const accRes = await fetch('/api/accounts')
                const accounts = accRes.ok ? await accRes.json() : []

                // Fetch content queue
                const contentRes = await fetch('/api/content')
                const content = contentRes.ok ? await contentRes.json() : []

                // Fetch unified history
                const [liRes, genRes] = await Promise.all([
                    fetch('/api/linkedin/posts'),
                    fetch('/api/posts')
                ])
                const liData = liRes.ok ? await liRes.json() : []
                const genData = genRes.ok ? await genRes.json() : []

                const unified = [
                    ...liData.map((p: any) => ({ ...p, _type: 'linkedin' })),
                    ...genData.map((p: any) => ({ ...p, _type: 'generic' }))
                ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                setPostHistory(unified)

                setStats({
                    accountsCount: Array.isArray(accounts) ? accounts.length : 0,
                    pendingContent: Array.isArray(content) ? content.filter((c: any) => c.status === 'pending').length : 0,
                    aiLogsCount: content.length + unified.length, // More dynamic AI-driven stat
                    engagement: "0%"
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Engine Telemetry */}
            <SystemStatus />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
                <p className="text-white/60">Overview of your social presence and AI workflows.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <DashboardCard
                    title="Connected Accounts"
                    icon={Share2}
                    value={loading ? "..." : stats.accountsCount}
                    description="Active platforms"
                />
                <DashboardCard
                    title="Content Queue"
                    icon={Layers}
                    value={loading ? "..." : stats.pendingContent}
                    description="Posts waiting"
                />
                <DashboardCard
                    title="AI Actions"
                    icon={Sparkles}
                    value={loading ? "..." : stats.aiLogsCount}
                    description="decisions made"
                />
                <DashboardCard
                    title="Engagement"
                    icon={Activity}
                    value={stats.engagement}
                    description="vs last month"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 space-y-6">
                    <AiGeneratedContentPlaceholder />
                    <Card className="bg-neutral-900 border-white/10 text-white shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold">Recent Distribution Activity</CardTitle>
                            <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Live Feed ✅</span>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="h-[200px] flex items-center justify-center">
                                    <Loader2 className="animate-spin text-purple-500" />
                                </div>
                            ) : postHistory.length === 0 ? (
                                <div className="h-[200px] flex items-center justify-center text-white/40 text-sm border border-dashed border-white/10 rounded-xl bg-white/5">
                                    No recent activity recorded.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {postHistory.slice(0, 5).map((post: any) => (
                                        <div key={post.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className={cn(
                                                    "size-2 rounded-full",
                                                    post.status === 'PUBLISHED' ? "bg-emerald-500" : "bg-red-500"
                                                )} />
                                                <div className="flex flex-col truncate">
                                                    <span className="text-sm font-bold truncate">{post.title || post.contentText || "Automated Post"}</span>
                                                    <span className="text-[10px] text-white/40 uppercase tracking-widest">
                                                        {new Date(post.createdAt).toLocaleTimeString()} • {post.postType || (post._type === 'linkedin' ? 'Article' : 'Direct')}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link href="/dashboard/queue">
                                                <Button size="sm" variant="ghost" className="h-8 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">
                                                    Details
                                                </Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-3 space-y-6">
                    <PlatformPolicyCard />
                    <Card className="bg-neutral-900 border-white/10 text-white shadow-sm">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <button
                                onClick={async () => {
                                    const { toast } = await import("sonner")
                                    toast.promise(
                                        fetch('/api/ai/trigger', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ batch_size: 5 })
                                        }).then(async res => {
                                            if (!res.ok) throw new Error(await res.text());
                                            return res.json();
                                        }),
                                        {
                                            loading: 'Initializing Neural Engine...',
                                            success: (data) => `Campaign Active: ${data.processing_count || 0} items queued for analysis`,
                                            error: 'AI Trigger Failed'
                                        }
                                    )
                                }}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-900/40 active:scale-[0.98]"
                            >
                                Generate AI Campaign
                            </button>
                            <button
                                onClick={async () => {
                                    const { toast } = await import("sonner")
                                    toast.promise(
                                        fetch('/api/content/fetch', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ sources: ['rss', 'reddit', 'news_api', 'unsplash', 'pexels'] })
                                        }).then(res => res.ok ? res.json() : Promise.reject()),
                                        {
                                            loading: 'Fetching fresh content...',
                                            success: (data) => `Ingested ${data.saved} new items!`,
                                            error: 'Failed to fetch content'
                                        }
                                    )
                                }}
                                className="w-full h-12 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-sm font-bold transition-all active:scale-[0.98]"
                            >
                                Fetch Fresh Content
                            </button>
                            <Link href="/dashboard/connect" className="block text-center">
                                <button className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors">
                                    Connect New Platform
                                </button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function DashboardCard({ title, icon: Icon, value, description }: any) {
    return (
        <Card className="bg-neutral-900 border-white/10 text-white hover:border-purple-500/30 transition-all cursor-default">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/70">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-white/40">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}
