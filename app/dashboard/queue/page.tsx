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
    MoreHorizontal,
    Trash2,
    Wand2,
    Image as ImageIcon,
    Link as LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function QueuePage() {
    const [activeTab, setActiveTab] = useState("queue")
    const [loading, setLoading] = useState(true)
    const [queue, setQueue] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Ingested Queue
            const qRes = await fetch('/api/content')
            const qData = await qRes.json()

            // 2. Fetch History (LinkedIn Posts & App Scheduled Posts)
            const [liRes, appRes] = await Promise.all([
                fetch('/api/linkedin/posts'),
                fetch('/api/posts')
            ])

            const liData = await liRes.json()
            const appData = await appRes.json()

            setQueue(qData.content || [])

            // Unify history: Filter out duplicates (scheduled posts that have a matching trackingId)
            const liPosts = (liData.posts || []).map((p: any) => ({ ...p, _type: 'linkedin' }));
            const scheduledPosts = (appData.data || []).map((p: any) => ({ ...p, _type: 'app_scheduled' }));

            // Combine and sort by date
            const combinedHistory = [...liPosts, ...scheduledPosts]
                // Deduplicate: If an 'app_scheduled' post has a contentId that matches a 'linkedin' post ID, keep the 'linkedin' one
                .filter((p, index, self) => {
                    if (p._type === 'app_scheduled' && p.contentId) {
                        return !self.some(other => other._type === 'linkedin' && other.id === p.contentId);
                    }
                    return true;
                })
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            setHistory(combinedHistory)
        } catch (error) {
            toast.error("Failed to sync engine data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'PUBLISHED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'PROCESSING': return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
            case 'SCHEDULED': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'CANCELLED': return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';
            default: return 'bg-white/5 text-white/40 border-white/10';
        }
    }

    const handleCancelPost = async (postId: string) => {
        if (!confirm("Are you sure you want to cancel this scheduled post?")) return;
        try {
            const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Post cancelled successfully")
                fetchData()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to cancel post")
            }
        } catch (e) {
            toast.error("Connection error")
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
                        {loading ? <RefreshCw className="size-4 animate-spin" /> : <RefreshCw className="size-4 mr-2" />}
                        Refresh Engine
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Pending Queue', val: queue.filter(q => q.status === 'pending').length, icon: Layers, color: 'text-blue-400' },
                    { label: 'Scheduled', val: history.filter(h => h.status === 'SCHEDULED' || h.status === 'pending').length, icon: Clock, color: 'text-purple-400' },
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

                                            <Button
                                                className="rounded-xl bg-purple-600 hover:bg-purple-500 font-bold px-4"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`/api/content/${item.id}/approve`, { method: 'POST' });
                                                        const data = await res.json();
                                                        if (res.ok) {
                                                            toast.success(data.message || "Approved & Scheduled successfully!");
                                                            fetchData();
                                                        } else {
                                                            toast.error(data.error || "Failed to schedule");
                                                        }
                                                    } catch (e) {
                                                        toast.error("Connection error");
                                                    }
                                                }}
                                                title="Approve & Schedule Automatically"
                                            >
                                                <Wand2 className="size-4 mr-2" /> Auto Schedule
                                            </Button>

                                            <Link href={`/dashboard/composer?title=${encodeURIComponent(item.title || '')}&description=${encodeURIComponent(item.summary || '')}&mediaUrl=${encodeURIComponent(item.mediaUrl || '')}`} title="Edit Manually in Composer">
                                                <Button className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 size-12 p-0">
                                                    <Send className="size-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                className="rounded-xl border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 size-12 p-0 transition-colors"
                                                title="Discard"
                                                onClick={async () => {
                                                    if (!confirm("Discard this intelligence?")) return;
                                                    try {
                                                        const res = await fetch(`/api/content/${item.id}`, { method: 'DELETE' });
                                                        if (res.ok) {
                                                            toast.success("Content discarded");
                                                            fetchData();
                                                        } else {
                                                            toast.error("Failed to discard");
                                                        }
                                                    } catch (e) {
                                                        toast.error("Connection error");
                                                    }
                                                }}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
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
                                                <Badge className="bg-white/10 text-[8px] font-black uppercase">
                                                    {post.postType || 'TEXT'}
                                                </Badge>
                                                <div className="h-4 w-px bg-white/5" />
                                                <Badge className={cn("text-[8px] font-black uppercase", post.targetType === 'GROUP' ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400")}>
                                                    {post.targetType || 'FEED'}
                                                </Badge>
                                                <div className="h-4 w-px bg-white/5" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
                                                    {new Date(post.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <h4 className="text-xl font-black text-white leading-tight line-clamp-1">{post.title || post.contentText?.substring(0, 50) || "Social Transmission"}</h4>
                                            <p className="text-sm text-white/40 line-clamp-2 font-medium">{post.description || post.contentText}</p>

                                            {(post.targetType === 'GROUP' || post.groupIds?.length > 0) && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {(post.groupIds || [post.targetId]).filter(Boolean).map((gid: string) => (
                                                        <span key={gid} className="text-[9px] font-black px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 uppercase">
                                                            Group: {gid.split(':').pop()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {post.errorMessage || post.lastError ? (
                                                <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-400 text-xs">
                                                    <AlertCircle className="size-4" />
                                                    <span className="font-bold underline decoration-dotted underline-offset-4">Error Log:</span>
                                                    <span className="opacity-80 italic">{post.errorMessage || post.lastError}</span>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex flex-col md:items-end justify-between self-stretch gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "size-8 rounded-full flex items-center justify-center border",
                                                    post._type === 'linkedin' || post.platform === 'linkedin' ? "bg-blue-600/10 border-blue-500/20" : "bg-purple-600/10 border-purple-500/20"
                                                )}>
                                                    <span className={cn(
                                                        "text-[10px] font-black uppercase",
                                                        post._type === 'linkedin' || post.platform === 'linkedin' ? "text-blue-400" : "text-purple-400"
                                                    )}>
                                                        {post.platform?.substring(0, 2) || (post._type === 'linkedin' ? 'LI' : 'GP')}
                                                    </span>
                                                </div>
                                                <span className="text-xs font-black text-white/60">
                                                    {post.socialAccount?.metadata?.name || post.socialAccount?.metadata?.username || post.platform || "Platform User"}
                                                </span>
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
                                                                const retryUrl = post._type === 'linkedin'
                                                                    ? `/api/linkedin/posts/${post.id}/retry`
                                                                    : `/api/posts/scheduled/${post.id}/retry`
                                                                const res = await fetch(retryUrl, { method: 'POST' })
                                                                if (res.ok) {
                                                                    toast.success("Post queued for retry!")
                                                                    fetchData()
                                                                } else {
                                                                    const data = await res.json()
                                                                    toast.error(data.error || "Retry failed")
                                                                }
                                                            } catch (e) {
                                                                toast.error("Retry connection error")
                                                            }
                                                        }}
                                                        className="rounded-xl bg-red-600 hover:bg-red-500 text-[10px] font-black uppercase tracking-widest h-10 px-6"
                                                    >
                                                        Retry Job <RefreshCw className="size-3 ml-2" />
                                                    </Button>
                                                ) : (post.status === 'SCHEDULED' || post.status === 'pending') ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleCancelPost(post.id)}
                                                        className="rounded-xl border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-[10px] font-black uppercase tracking-widest h-10 px-6"
                                                    >
                                                        Cancel Entry <Trash2 className="size-3 ml-2" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
