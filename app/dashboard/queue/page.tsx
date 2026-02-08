
"use client"

import React, { useState, useEffect } from "react"
import {
    Layers,
    Clock,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    ExternalLink,
    Send,
    Filter,
    Calendar,
    ChevronRight,
    Search,
    History,
    MoreHorizontal
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function QueuePage() {
    const [loading, setLoading] = useState(true)
    const [queue, setQueue] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState("queue")

    const fetchData = async () => {
        setLoading(true)
        try {
            // Fetch content queue
            const queueRes = await fetch('/api/content')
            if (queueRes.ok) {
                const queueData = await queueRes.json()
                setQueue(queueData)
            }

            // Fetch LinkedIn post history
            const historyRes = await fetch('/api/linkedin/posts')
            if (historyRes.ok) {
                const historyData = await historyRes.json()
                setHistory(historyData)
            }
        } catch (error) {
            toast.error("Failed to sync content data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PUBLISHED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'PROCESSING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
            case 'SCHEDULED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 space-y-12 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
                <div className="space-y-4">
                    <h1 className="text-5xl font-black tracking-tight leading-none bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
                        Engine Status
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl leading-relaxed">
                        End-to-end monitoring of your content pipeline, background jobs, and distribution history.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={fetchData}
                        className="rounded-2xl border border-white/10 hover:bg-white/5"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("size-4 mr-2", loading && "animate-spin")} />
                        Refresh Engine
                    </Button>
                    <Link href="/dashboard/linkedin/post">
                        <Button className="rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold px-8">
                            New Broadcast
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Queue', val: queue.filter(q => q.status === 'pending').length, icon: Layers, color: 'text-blue-400' },
                    { label: 'Scheduled', val: history.filter(h => h.status === 'SCHEDULED').length, icon: Clock, color: 'text-purple-400' },
                    { label: 'Successful', val: history.filter(h => h.status === 'PUBLISHED').length, icon: CheckCircle2, color: 'text-emerald-400' },
                    { label: 'Total Logs', val: history.length, icon: History, color: 'text-white/40' },
                ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <stat.icon className={cn("size-5", stat.color)} />
                            <span className="text-2xl font-black">{stat.val}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Main Tabs Logic */}
            <Tabs defaultValue="queue" className="w-full space-y-8" onValueChange={setActiveTab}>
                <TabsList className="bg-white/5 border border-white/10 rounded-2xl h-14 p-1">
                    <TabsTrigger value="queue" className="rounded-xl px-8 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">
                        <Layers className="size-4 mr-2" /> Content Feed
                    </TabsTrigger>
                    <TabsTrigger value="history" className="rounded-xl px-8 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-widest">
                        <History className="size-4 mr-2" /> Distribution History
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: CONTENT QUEUE (Incoming) */}
                <TabsContent value="queue" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    {queue.length === 0 ? (
                        <div className="rounded-[2.5rem] border-2 border-dashed border-white/5 p-24 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                            <Layers className="size-12 text-white/10 mb-6" />
                            <h3 className="text-xl font-bold">No Ingested Content</h3>
                            <p className="text-white/40 mt-2 max-w-sm">The content ingestion layer hasn't retrieved any new articles or posts yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {queue.map((item) => (
                                <Card key={item.id} className="bg-white/[0.02] border-white/5 rounded-3xl group hover:bg-white/[0.04] transition-all hover:border-white/10 overflow-hidden">
                                    <CardContent className="p-6 flex items-center justify-between gap-6">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="size-16 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                                                {item.contentType === 'image' ? <ImageIcon className="size-6 text-emerald-400" /> : <LinkIcon className="size-6 text-blue-400" />}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/20">{item.source}</span>
                                                    <div className="h-1 w-1 rounded-full bg-white/10" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h4 className="text-lg font-bold text-white/90 line-clamp-1">{item.title || "Untitled Intelligence"}</h4>
                                                <p className="text-sm text-white/40 line-clamp-2 leading-relaxed">{item.summary || item.rawContent?.substring(0, 150)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Viral Score</span>
                                                <span className="text-sm font-black text-purple-400">{item.viralScore}%</span>
                                            </div>
                                            <Link href={`/dashboard/linkedin/post?title=${encodeURIComponent(item.title || '')}&description=${encodeURIComponent(item.summary || '')}&mediaUrl=${encodeURIComponent(item.mediaUrl || '')}`}>
                                                <Button className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 size-12 p-0">
                                                    <Send className="size-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* TAB 2: DISTRIBUTION LOGS (LinkedIn Stats) */}
                <TabsContent value="history" className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                    {history.length === 0 ? (
                        <div className="rounded-[2.5rem] border-2 border-dashed border-white/5 p-24 flex flex-col items-center justify-center text-center bg-white/[0.01]">
                            <Clock className="size-12 text-white/10 mb-6" />
                            <h3 className="text-xl font-bold">No Dispatch History</h3>
                            <p className="text-white/40 mt-2 max-w-sm">You haven't attempted to broadcast any content to LinkedIn yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((post) => (
                                <Card key={post.id} className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden">
                                    <div className="flex flex-col md:flex-row md:items-center p-6 gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Badge className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em]", getStatusColor(post.status))}>
                                                    {post.status}
                                                </Badge>
                                                <div className="h-4 w-px bg-white/5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                                    {new Date(post.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-white leading-tight line-clamp-1">{post.title || "Social Transmission"}</h4>
                                            <p className="text-sm text-white/40 line-clamp-2 font-medium">{post.description}</p>

                                            {post.errorMessage && (
                                                <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-400 text-xs">
                                                    <AlertCircle className="size-4" />
                                                    <span className="font-bold underline decoration-dotted underline-offset-4">Error Log:</span>
                                                    <span className="opacity-80 italic">{post.errorMessage}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col md:items-end justify-between self-stretch gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="size-8 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                                    <span className="text-[10px] font-black text-blue-400">IN</span>
                                                </div>
                                                <span className="text-xs font-black text-white/60">{post.socialAccount?.metadata?.username || "LinkedIn User"}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {post.linkedinPostUrn ? (
                                                    <a
                                                        href={`https://www.linkedin.com/feed/update/${post.linkedinPostUrn.split(',')[0]}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Button size="sm" variant="ghost" className="rounded-xl border border-white/10 hover:bg-white/5 text-[10px] font-black uppercase tracking-widest h-10 px-6">
                                                            View Result <ExternalLink className="size-3 ml-2" />
                                                        </Button>
                                                    </a>
                                                ) : post.status === 'FAILED' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch(`/api/linkedin/posts/${post.id}/retry`, { method: 'POST' })
                                                                if (res.ok) {
                                                                    toast.success("Retry initiated!")
                                                                    fetchData()
                                                                } else {
                                                                    toast.error("Retry failed")
                                                                }
                                                            } catch (e) {
                                                                toast.error("Connection error")
                                                            }
                                                        }}
                                                        className="rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest h-10 px-6"
                                                    >
                                                        Retry Dispatch <RefreshCw className="size-3 ml-2" />
                                                    </Button>
                                                ) : (
                                                    <Button disabled size="sm" variant="ghost" className="rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest h-10 px-6 opacity-30">
                                                        Dispatch Blocked
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" className="rounded-xl border border-white/10 hover:bg-white/5 size-10 p-0">
                                                    <MoreHorizontal className="size-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    {['PROCESSING', 'FAILED', 'PARTIAL_SUCCESS'].includes(post.status) && (
                                        <div className="h-1 w-full bg-white/5">
                                            <div className={cn(
                                                "h-full transition-all duration-1000",
                                                post.status === 'PROCESSING' ? "w-1/2 bg-blue-500 animate-pulse" : "w-full bg-red-500/50"
                                            )} />
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function ImageIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
}

function LinkIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
    )
}
