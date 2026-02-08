"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, ArrowRight, Clock, Trash2, Send, Loader2, Image as ImageIcon, Link as LinkIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AiGeneratedContentPlaceholder() {
    const [loading, setLoading] = useState(true)
    const [aiPosts, setAiPosts] = useState<any[]>([])
    const router = useRouter()

    const fetchQueue = async () => {
        try {
            const res = await fetch('/api/content')
            if (res.ok) {
                const data = await res.json()
                // Filter for pending items
                setAiPosts(data.filter((item: any) => item.status === 'pending').slice(0, 5))
            }
        } catch (error) {
            console.error("Failed to fetch queue", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQueue()
    }, [])

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/content/${id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("Content dismissed.")
                setAiPosts(prev => prev.filter(p => p.id !== id))
            } else {
                toast.error("Failed to dismiss content.")
            }
        } catch (error) {
            toast.error("Error connecting to server")
        }
    }

    const handleApprove = (item: any) => {
        // Redirect to composer with data
        router.push(`/dashboard/linkedin/post?title=${encodeURIComponent(item.title || '')}&description=${encodeURIComponent(item.summary || '')}&mediaUrl=${encodeURIComponent(item.mediaUrl || '')}`)
    }

    return (
        <Card className="bg-neutral-900 border-white/10 text-white shadow-xl shadow-purple-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="size-5 text-yellow-400" />
                        <CardTitle className="text-lg">AI Content Recommendations</CardTitle>
                    </div>
                    <CardDescription className="text-white/40">Suggested broadcasts from your ingestion engine.</CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchQueue}
                    className="h-8 border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                >
                    Refine List
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="h-[200px] flex items-center justify-center">
                        <Loader2 className="size-6 animate-spin text-purple-500" />
                    </div>
                ) : aiPosts.length === 0 ? (
                    <div className="h-[200px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                        <Sparkles className="size-8 text-white/10 mb-4" />
                        <p className="text-sm text-white/40 italic">Inspiration engine is quiet. Connect more sources in Settings.</p>
                    </div>
                ) : (
                    aiPosts.map((post) => (
                        <div key={post.id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4 group hover:bg-white/[0.05] hover:border-purple-500/30 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded bg-white/5 flex items-center justify-center">
                                        {post.contentType === 'image' ? <ImageIcon className="size-3 text-emerald-400" /> : <LinkIcon className="size-3 text-blue-400" />}
                                    </div>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{post.source || "Web Intel"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/20">
                                    <Clock className="size-3" />
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-black text-white/90 leading-tight line-clamp-1">{post.title || "Untitled Intelligence"}</h4>
                                <p className="text-xs text-white/40 leading-relaxed line-clamp-2">"{post.summary || post.rawContent?.substring(0, 100)}"</p>
                            </div>
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => handleDelete(post.id)}
                                    className="p-2 hover:bg-red-500/20 text-white/20 hover:text-red-400 rounded-xl transition-all"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                                <button
                                    onClick={() => handleApprove(post)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-purple-900/40"
                                >
                                    <Send className="size-3" />
                                    Edit & Distribute
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    )
}
