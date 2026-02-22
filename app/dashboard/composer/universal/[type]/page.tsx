"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
    Loader2, ArrowLeft, Send, Clock, Globe, Shield, CheckCircle2,
    AlertTriangle, Share2, ImageIcon, Video, AlignLeft, Layout,
    Users, RefreshCw, PenTool, Sparkles, Command, Layers
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const POST_TYPES: Record<string, any> = {
    "text": { label: "Text Only", icon: AlignLeft },
    "image": { label: "Images", icon: ImageIcon },
    "video": { label: "Videos", icon: Video },
    "text-images": { label: "Text + Images", icon: Layers },
    "text-video": { label: "Text + Videos", icon: Layout },
    "all": { label: "Dynamic", icon: Users },
}

export default function UniversalConfigPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const type = params.type as string
    const postTypeInfo = POST_TYPES[type] || { label: "Post", icon: PenTool }

    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [intelligence, setIntelligence] = useState<any>(null)
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
    const [formData, setFormData] = useState({
        topic: '',
        contentText: '',
        mediaUrl: '',
        scheduledAt: '',
        isManual: true
    })

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
                if (data.length > 0) {
                    setSelectedAccounts(data.map((a: any) => a.id))
                }
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error)
        }
    }

    const toggleAccount = (id: string) => {
        setSelectedAccounts(prev =>
            prev.includes(id) ? prev.filter(accId => accId !== id) : [...prev, id]
        )
    }

    const handleGenerate = async () => {
        if (!formData.topic) {
            toast.error("Please enter a topic first")
            return
        }

        setGenerating(true)
        try {
            const res = await fetch('/api/content/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: formData.topic,
                    audience: session?.user?.email || "General",
                    tone: "Professional"
                })
            })

            if (!res.ok) throw new Error("Failed to generate intelligence")

            const data = await res.json()
            setIntelligence(data)
            setFormData(prev => ({ ...prev, contentText: data.content }))
            toast.success("Intelligence loop complete!")
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setGenerating(false)
        }
    }

    const handlePublish = async () => {
        if (selectedAccounts.length === 0) {
            toast.error("Please select at least one platform")
            return
        }
        if (!formData.contentText && type === "text") {
            toast.error("Please enter content text")
            return
        }

        setLoading(true)
        try {
            for (const accountId of selectedAccounts) {
                const account = accounts.find(a => a.id === accountId)
                const platformKey = account?.platform?.toLowerCase()
                const platformContent = intelligence?.platformContent?.[platformKey]

                const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentText: platformContent?.text || formData.contentText,
                        mediaUrl: formData.mediaUrl,
                        scheduledAt: formData.scheduledAt,
                        postType: type.toUpperCase().replace("-", "_"),
                        targetType: 'FEED',
                        socialAccountId: accountId,
                        publishNow: !formData.scheduledAt
                    })
                })
                if (!res.ok) throw new Error(`Failed for ${account?.platform}`)
            }

            toast.success(formData.scheduledAt ? "Posts scheduled successfully!" : "Posts published successfully!")
            router.push('/dashboard/queue')
        } catch (error: any) {
            toast.error(error.message || "An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5" onClick={() => router.back()}>
                        <ArrowLeft className="size-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <postTypeInfo.icon className="size-4 text-purple-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Universal Configuration</span>
                        </div>
                        <h1 className="text-3xl font-black text-white">Post: {postTypeInfo.label}</h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* Content Editor */}
                    <Card className="bg-neutral-900 border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="space-y-6 relative z-10">
                            <div className="space-y-4">
                                <Label className="text-xs uppercase tracking-widest font-black text-white/40">Topic / Idea</Label>
                                <div className="flex gap-2">
                                    <Input
                                        className="bg-black/40 border-white/10 h-14 rounded-2xl focus:border-purple-500/50"
                                        placeholder="e.g. AI Trends in 2026 for small businesses"
                                        value={formData.topic}
                                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                                    />
                                    <Button
                                        className="h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-bold px-6"
                                        onClick={handleGenerate}
                                        disabled={generating}
                                    >
                                        {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4 mr-2" />}
                                        Analyze & Create
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs uppercase tracking-widest font-black text-white/40">Master Content</Label>
                                <textarea
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 min-h-[150px] outline-none focus:border-purple-500/50 transition-all text-white font-medium resize-none shadow-inner"
                                    placeholder="Click above to use AI Intelligence, or write your own..."
                                    value={formData.contentText}
                                    onChange={e => setFormData({ ...formData, contentText: e.target.value })}
                                />
                                <div className="flex justify-between items-center">
                                    {intelligence && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                                                <Shield className="size-3" /> {intelligence.safety?.isSafe ? "Safe" : "Flagged"}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1">
                                                <Sparkles className="size-3" /> {intelligence.analytics?.engagementEstimate}% Engagement
                                            </span>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-right text-white/20 uppercase font-bold ml-auto">{formData.contentText.length} Characters</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Intelligence Insights */}
                    {intelligence && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <Card className="bg-black/40 border-white/5 rounded-[1.5rem] p-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="size-3 text-orange-400" /> Compliance Audit
                                </h3>
                                <p className="text-xs text-white/60 italic leading-relaxed">
                                    {intelligence.safety?.reason || "Content verified for platform guidelines. No spam or restricted content detected."}
                                </p>
                            </Card>
                            <Card className="bg-black/40 border-white/5 rounded-[1.5rem] p-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3 flex items-center gap-2">
                                    <RefreshCw className="size-3 text-purple-400" /> Intelligence Loop
                                </h3>
                                <p className="text-xs text-white/60 italic leading-relaxed">
                                    {intelligence.feedback || "Learning from this cycle to improve future engagement patterns."}
                                </p>
                            </Card>
                        </div>
                    )}

                    {/* Media Asset Section */}
                    {(type.includes("image") || type.includes("video") || type === "all") && (
                        <Card className="bg-neutral-900 border-white/10 rounded-[2rem] p-8 shadow-2xl">
                            <div className="space-y-4">
                                <Label className="text-xs uppercase tracking-widest font-black text-white/40">Media Asset</Label>
                                <div className="relative group">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                        {type.includes("video") ? <Video className="size-4 text-white/20" /> : <ImageIcon className="size-4 text-white/20" />}
                                    </div>
                                    <Input
                                        className="bg-black/40 border-white/10 h-14 pl-14 rounded-2xl focus:border-purple-500/50 text-white"
                                        placeholder="Enter image or video URL..."
                                        value={formData.mediaUrl}
                                        onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Platform Delivery Section */}
                    <div className="space-y-4">
                        <Label className="text-xs uppercase tracking-widest font-black text-white/40 ml-2">Platform Tailoring & Delivery</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {accounts.map(acc => {
                                const platformKey = acc.platform.toLowerCase();
                                const tailored = intelligence?.platformContent?.[platformKey];

                                return (
                                    <div
                                        key={acc.id}
                                        onClick={() => toggleAccount(acc.id)}
                                        className={cn(
                                            "p-6 rounded-[2rem] border cursor-pointer transition-all flex flex-col gap-4 group",
                                            selectedAccounts.includes(acc.id)
                                                ? "bg-neutral-900 border-purple-500/50 shadow-xl shadow-purple-900/10"
                                                : "bg-neutral-900/50 border-white/5 hover:border-white/10"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center transition-colors shadow-lg",
                                                    selectedAccounts.includes(acc.id) ? "bg-purple-500 text-white" : "bg-white/5 text-white/40"
                                                )}>
                                                    <Share2 className="size-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white capitalize">{acc.platform}</h4>
                                                    <p className="text-[10px] text-white/40 truncate w-32">{acc.metadata?.name || acc.platformAccountId}</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "size-5 rounded-full border flex items-center justify-center transition-all",
                                                selectedAccounts.includes(acc.id) ? "bg-purple-500 border-purple-500" : "bg-transparent border-white/20 group-hover:border-white/40"
                                            )}>
                                                {selectedAccounts.includes(acc.id) && <CheckCircle2 className="size-3 text-white" strokeWidth={4} />}
                                            </div>
                                        </div>

                                        {tailored && selectedAccounts.includes(acc.id) && (
                                            <div className="mt-2 space-y-3 animate-in zoom-in-95 duration-300">
                                                <div className="p-4 rounded-2xl bg-black/60 border border-white/5 backdrop-blur-sm">
                                                    <p className="text-[11px] text-white/90 leading-relaxed font-medium line-clamp-4 italic">
                                                        "{tailored.text}"
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {tailored.hashtags?.map((tag: string) => (
                                                        <span key={tag} className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                                                        Agent Rule: {tailored.mediaRules}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Execution Strategy */}
                    <Card className="bg-neutral-900 border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden relative">
                        <div className="relative z-10 space-y-6">
                            <div className="space-y-4">
                                <Label className="text-xs uppercase tracking-widest font-black text-white/40 flex items-center gap-2">
                                    <Clock className="size-3" /> Execution Strategy
                                </Label>
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-14 rounded-2xl border-white/10 bg-white/5 justify-start text-xs font-bold transition-all",
                                            !formData.scheduledAt && "bg-purple-500/10 border-purple-500/50 text-white"
                                        )}
                                        onClick={() => setFormData({ ...formData, scheduledAt: '' })}
                                    >
                                        <Send className="size-4 mr-3" /> Publish Instantly
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full h-14 rounded-2xl border-white/10 bg-white/5 justify-start text-xs font-bold transition-all",
                                            formData.scheduledAt !== '' && "bg-blue-500/10 border-blue-500/50 text-white"
                                        )}
                                        onClick={() => setFormData({ ...formData, scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16) })}
                                    >
                                        <Clock className="size-4 mr-3" /> Schedule Post
                                    </Button>
                                </div>
                            </div>

                            {formData.scheduledAt !== '' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">Global Schedule Time</Label>
                                    <Input
                                        type="datetime-local"
                                        className="bg-black/40 border-white/10 h-14 rounded-2xl font-bold invert opacity-60 text-xs"
                                        value={formData.scheduledAt}
                                        onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                                    />
                                    <p className="text-[10px] text-white/20 italic">Platform-specific timing can be set later in the queue.</p>
                                </div>
                            )}

                            <Button
                                className={cn(
                                    "w-full h-16 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg",
                                    !formData.scheduledAt ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20" : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                                )}
                                disabled={loading}
                                onClick={handlePublish}
                            >
                                {loading ? <Loader2 className="size-4 animate-spin" /> : (
                                    <span className="flex items-center gap-2">
                                        {formData.scheduledAt ? "Queue Global Posts" : "Launch Everywhere"}
                                        <Command className="size-4" />
                                    </span>
                                )}
                            </Button>
                        </div>
                        {/* Decorative background flair */}
                        <div className={cn(
                            "absolute -right-20 -top-20 size-60 blur-[80px] opacity-10 transition-colors",
                            !formData.scheduledAt ? "bg-purple-600" : "bg-blue-600"
                        )} />
                    </Card>

                    {/* Preview Hint */}
                    <div className="p-6 border border-white/5 bg-white/[0.02] rounded-[2rem] text-center">
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em] mb-4">Post Sandbox</p>
                        <p className="text-[10px] text-white/40 leading-relaxed italic">
                            The Orchestrator Agent has automatically applied platform-specific format rules (e.g., character limits, tag styling) to your previews.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
