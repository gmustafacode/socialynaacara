"use client"

import React, { useState, useEffect } from 'react'
import {
    Send, Globe, Layout, Type, Image as ImageIcon, Loader2,
    ArrowLeft, Monitor, Shield, Sparkles, AlertTriangle, CheckCircle2,
    Clock, RefreshCw, PenTool
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function UniversalComposer() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])

    // --- WIZARD STATE ---
    // 1: Choose Method (Manual vs AI)
    // 2: AI Parameters
    // 3: Editor & Review (Optimization & Moderation)
    // 4: Final Approval & Dispatch
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

    const [creationMethod, setCreationMethod] = useState<'MANUAL' | 'AI' | null>(null)
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

    // AI Generation State
    const [aiParams, setAiParams] = useState({
        topic: '',
        audience: '',
        tone: 'Professional'
    })

    // Content State (for Step 3)
    const [formData, setFormData] = useState({
        contentText: '',
        mediaUrl: '',
        scheduledAt: '',
    })

    // Moderation State
    const [isContentSafe, setIsContentSafe] = useState<boolean | null>(null)
    const [moderationFlags, setModerationFlags] = useState<string[]>([])

    useEffect(() => {
        fetchAccounts()
    }, [])

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
                // Auto-select first if none selected
                if (data.length > 0 && selectedAccounts.length === 0) {
                    setSelectedAccounts([data[0].id])
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

    // ========== STEP HANDLERS ==========

    const handleMethodSelect = (method: 'MANUAL' | 'AI') => {
        setCreationMethod(method)
        if (method === 'MANUAL') {
            setStep(3) // Skip AI params, go straight to Editor
        } else {
            setStep(2) // Go to AI config
        }
    }

    const handleGenerateAI = async () => {
        if (!aiParams.topic) return toast.error("Please enter a topic")

        setLoading(true)
        // Simulate "Internet Research Agent" & "AI Generation"
        // In real backend, this calls `contentEngine` or a specific API route.
        toast.info("Internet Researching Agent is gathering context...")

        setTimeout(() => {
            const draftedContent = `🚀 **${aiParams.topic}**\n\nAI Generated content tailored for a ${aiParams.tone} tone aiming at ${aiParams.audience || 'general audiences'}.\n\nHere are 3 key takeaways:\n1. Innovation is key\n2. Always adapt to new trends\n3. Engage your audience authentically\n\nWhat are your thoughts? Drop a comment below! 👇\n\n#${aiParams.topic.replace(/\s+/g, '')} #Innovation #FutureTalk`
            setFormData({ ...formData, contentText: draftedContent })
            setIsContentSafe(null) // Reset moderation
            setLoading(false)
            setStep(3) // Move to Review/Edit
        }, 2500)
    }

    const runModerationCheck = () => {
        // Simulate "Moderation Agent"
        setLoading(true)
        setTimeout(() => {
            const lowercaseContent = formData.contentText.toLowerCase()
            const spamWords = ['buy now', 'crypto', 'guaranteed', 'click here', 'free money']
            const foundFlags = spamWords.filter(word => lowercaseContent.includes(word))

            if (foundFlags.length > 0) {
                setIsContentSafe(false)
                setModerationFlags(foundFlags)
                toast.error("Content flagged by Moderation Agent")
            } else {
                setIsContentSafe(true)
                setModerationFlags([])
                toast.success("Content optimization and safety check passed!")
                setStep(4) // Move to Approval
            }
            setLoading(false)
        }, 1000)
    }

    const handleFinalDispatch = async () => {
        if (selectedAccounts.length === 0) {
            toast.error("Please select at least one target platform")
            return
        }

        setLoading(true)
        try {
            if (formData.scheduledAt) {
                const scheduledDate = new Date(formData.scheduledAt)
                const now = new Date()
                if (scheduledDate <= new Date(now.getTime() + 60000)) {
                    throw new Error("Scheduled time must be at least 1 minute in the future")
                }
            }

            // Dispatch to Orchestrator for EACH selected account
            for (const accountId of selectedAccounts) {
                const res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contentText: formData.contentText,
                        mediaUrl: formData.mediaUrl,
                        scheduledAt: formData.scheduledAt,
                        postType: 'TEXT',
                        targetType: 'FEED',
                        socialAccountId: accountId,
                        publishNow: !formData.scheduledAt
                    })
                })
                if (!res.ok) {
                    console.error(`Failed to dispatch for account ${accountId}`)
                }
            }

            toast.success(formData.scheduledAt ? "Posts successfully queued by Scheduler Agent!" : "Posts instantly dispatched by Publisher Agent!")
            router.push('/dashboard/queue')

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }


    // ========== RENDER HELPER ==========
    const renderAccountSelector = () => (
        <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Target Platforms</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {accounts.map(acc => {
                    const isSelected = selectedAccounts.includes(acc.id)
                    return (
                        <div
                            key={acc.id}
                            onClick={() => toggleAccount(acc.id)}
                            className={cn(
                                "p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 items-center text-center",
                                isSelected
                                    ? "bg-purple-500/10 border-purple-500 text-white"
                                    : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                            )}
                        >
                            <span className="text-xs font-black uppercase tracking-wider">{acc.platform}</span>
                            <span className="text-[10px] truncate w-full px-2" title={acc.metadata?.name || acc.platformAccountId}>
                                {acc.metadata?.name || acc.platformAccountId}
                            </span>
                        </div>
                    )
                })}
            </div>
            {selectedAccounts.length === 0 && <p className="text-[10px] text-red-400">Please select at least one platform.</p>}
        </div>
    )


    return (
        <div className="min-h-screen bg-black text-white p-6 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        {step > 1 && (
                            <button onClick={() => setStep(step === 4 ? 3 : step === 3 && creationMethod === 'MANUAL' ? 1 : (step - 1) as any)}
                                className="size-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                                <ArrowLeft className="size-4" />
                            </button>
                        )}
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
                            Smart Composer
                        </h1>
                    </div>
                    <p className="text-white/40 text-lg max-w-2xl leading-relaxed pl-[3.25rem]">
                        Omni-channel creation engine.
                        {step === 1 && " Choose your starting point."}
                        {step === 2 && " Configure the AI Research Agent."}
                        {step === 3 && " Review, edit, and optimize content."}
                        {step === 4 && " Final approval and scheduling."}
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={cn("h-1.5 rounded-full transition-all duration-500",
                            s === step ? "w-8 bg-purple-500" : s < step ? "w-4 bg-purple-500/40" : "w-4 bg-white/10"
                        )} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* MAIN CONTENT AREA */}
                <div className="lg:col-span-8 space-y-8">

                    {/* STEP 1: CHOOSE METHOD */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
                            <Card
                                onClick={() => handleMethodSelect('AI')}
                                className="bg-white/[0.02] hover:bg-white/[0.04] border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group rounded-[2rem]"
                            >
                                <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                                    <div className="size-20 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Sparkles className="size-10 text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black mb-2">AI Generated</h3>
                                        <p className="text-white/40 text-sm">Let our Research and Generation Agents draft highly optimized content based on your topic.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                onClick={() => handleMethodSelect('MANUAL')}
                                className="bg-white/[0.02] hover:bg-white/[0.04] border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group rounded-[2rem]"
                            >
                                <CardContent className="p-10 flex flex-col items-center text-center space-y-6">
                                    <div className="size-20 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <PenTool className="size-10 text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black mb-2">Write Manually</h3>
                                        <p className="text-white/40 text-sm">Start from a blank canvas. Best if you already have your exact copy ready to paste.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* STEP 2: AI PARAMETERS */}
                    {step === 2 && (
                        <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-4 space-y-10">
                            {renderAccountSelector()}

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Topic / Core Message</Label>
                                <Input
                                    className="bg-black/40 border-white/10 h-16 px-6 rounded-2xl font-bold text-lg focus:border-purple-500/50"
                                    placeholder="e.g., The impact of AI on indie hacking..."
                                    value={aiParams.topic}
                                    onChange={e => setAiParams({ ...aiParams, topic: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Target Audience (Optional)</Label>
                                    <Input
                                        className="bg-black/40 border-white/10 h-14 px-5 rounded-2xl focus:border-purple-500/50"
                                        placeholder="e.g., Tech founders, marketers"
                                        value={aiParams.audience}
                                        onChange={e => setAiParams({ ...aiParams, audience: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Tone & Style</Label>
                                    <select
                                        className="w-full bg-black/40 border border-white/10 h-14 px-5 rounded-2xl outline-none focus:border-purple-500/50"
                                        value={aiParams.tone}
                                        onChange={e => setAiParams({ ...aiParams, tone: e.target.value })}
                                    >
                                        <option value="Professional">Professional & Analytical</option>
                                        <option value="Casual">Casual & Friendly</option>
                                        <option value="Provocative">Provocative & Bold</option>
                                        <option value="Humorous">Humorous & Witty</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                onClick={handleGenerateAI}
                                disabled={loading || selectedAccounts.length === 0}
                                className="w-full bg-purple-600 hover:bg-purple-500 h-16 rounded-2xl text-sm font-black uppercase tracking-widest"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : "Deploy Research & Generation Agents"}
                            </Button>
                        </Card>
                    )}

                    {/* STEP 3: EDITOR & REVIEW */}
                    {step === 3 && (
                        <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-4 space-y-8">
                            {creationMethod === 'MANUAL' && renderAccountSelector()}

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Working Draft</Label>
                                    <span className="text-[10px] font-black text-white/20">{formData.contentText.length} Characters</span>
                                </div>
                                <textarea
                                    placeholder="Write or edit your content here..."
                                    className={cn(
                                        "w-full bg-black/40 border rounded-3xl min-h-[300px] p-8 text-xl font-medium outline-none transition-all resize-none shadow-2xl",
                                        isContentSafe === false ? "border-red-500/50 focus:border-red-500" : "border-white/10 focus:border-purple-500/50"
                                    )}
                                    value={formData.contentText}
                                    onChange={(e) => {
                                        setFormData({ ...formData, contentText: e.target.value })
                                        setIsContentSafe(null) // Require re-validation on edit
                                    }}
                                />
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Attach Media URL (Image/Video)</Label>
                                <div className="relative group">
                                    <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-white/20" />
                                    <Input
                                        placeholder="https://..."
                                        className="bg-black/40 border-white/10 h-16 pl-16 rounded-2xl font-bold"
                                        value={formData.mediaUrl}
                                        onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Moderation Warning UI */}
                            {isContentSafe === false && (
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-4 text-red-200">
                                    <AlertTriangle className="size-5 shrink-0 text-red-400" />
                                    <div>
                                        <h4 className="font-bold text-sm text-red-400">Moderation Agent Alert</h4>
                                        <p className="text-xs opacity-80 mt-1">We detected potentially unsafe or spammy keywords that might violate platform policies across some social networks.</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {moderationFlags.map(flag => (
                                                <span key={flag} className="px-2 py-1 bg-red-500/20 rounded-md text-[10px] font-bold uppercase">{flag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="flex gap-4">
                                {isContentSafe && (
                                    <Button
                                        onClick={() => setStep(4)}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 h-16 rounded-2xl text-sm font-black uppercase tracking-widest"
                                    >
                                        Content Approved <CheckCircle2 className="size-4 ml-2" />
                                    </Button>
                                )}

                                <Button
                                    onClick={runModerationCheck}
                                    disabled={loading || !formData.contentText || selectedAccounts.length === 0}
                                    variant={isContentSafe ? "outline" : "default"}
                                    className={cn("h-16 rounded-2xl text-sm font-black uppercase tracking-widest",
                                        isContentSafe ? "flex-1 border-white/10" : "w-full bg-blue-600 hover:bg-blue-500"
                                    )}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : (isContentSafe ? "Re-run Scan" : "Run Optimization & Safety Check ->")}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* STEP 4: APPROVAL & EXECUTION */}
                    {step === 4 && (
                        <Card className="bg-white/[0.02] border-white/5 rounded-[2.5rem] p-10 animate-in slide-in-from-bottom-4 space-y-10">

                            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 text-emerald-200">
                                <CheckCircle2 className="size-8 text-emerald-400 shrink-0" />
                                <div>
                                    <h3 className="font-black text-emerald-400">Content Approved</h3>
                                    <p className="text-sm opacity-80">Moderation Agent passed. Ready for dispatch.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xl font-bold">Execution Strategy</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Dispatch Now */}
                                    <div
                                        onClick={() => setFormData({ ...formData, scheduledAt: '' })}
                                        className={cn(
                                            "p-6 rounded-2xl border cursor-pointer transition-all",
                                            !formData.scheduledAt ? "bg-purple-500/10 border-purple-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <Send className={cn("size-6 mb-4", !formData.scheduledAt ? "text-purple-400" : "text-white/40")} />
                                        <h4 className="font-bold mb-1">Immediate Release</h4>
                                        <p className="text-xs text-white/50">Send to Publisher Agent instantly.</p>
                                    </div>

                                    {/* Schedule */}
                                    <div
                                        onClick={() => setFormData({ ...formData, scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16) })}
                                        className={cn(
                                            "p-6 rounded-2xl border cursor-pointer transition-all",
                                            formData.scheduledAt ? "bg-blue-500/10 border-blue-500" : "bg-white/5 border-white/10 hover:bg-white/10"
                                        )}
                                    >
                                        <Clock className={cn("size-6 mb-4", formData.scheduledAt ? "text-blue-400" : "text-white/40")} />
                                        <h4 className="font-bold mb-1">Schedule for Later</h4>
                                        <p className="text-xs text-white/50">Send to Scheduler Engine queue.</p>
                                    </div>
                                </div>

                                {formData.scheduledAt !== '' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 pt-4">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-white/40">Select Date & Time</Label>
                                        <Input
                                            type="datetime-local"
                                            className="bg-black/40 border-white/10 h-16 px-6 rounded-2xl font-bold invert opacity-70"
                                            value={formData.scheduledAt}
                                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleFinalDispatch}
                                disabled={loading}
                                className={cn(
                                    "w-full h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all",
                                    !formData.scheduledAt
                                        ? "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20"
                                        : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20"
                                )}
                            >
                                {loading ? <Loader2 className="animate-spin text-white" /> : (
                                    <div className="flex items-center gap-3">
                                        {formData.scheduledAt ? "Queue in Scheduler Engine" : "Dispatch to Publisher Engine"}
                                        {formData.scheduledAt ? <Clock className="size-4" /> : <Send className="size-4" />}
                                    </div>
                                )}
                            </Button>
                        </Card>
                    )}

                </div>

                {/* SIDEBAR PREVIEW - Only show on step 3 and 4 */}
                <div className="lg:col-span-4 hidden lg:block">
                    {(step === 3 || step === 4) ? (
                        <div className="sticky top-6 space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                                <Globe className="size-3" /> Selected Platforms ({selectedAccounts.length})
                            </h3>

                            <div className="space-y-4">
                                {selectedAccounts.map(id => {
                                    const acc = accounts.find(a => a.id === id)
                                    if (!acc) return null
                                    return (
                                        <Card key={id} className="bg-neutral-900 border-white/5 rounded-3xl p-6 shadow-2xl">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="size-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                                                    {acc.platform.substring(0, 1).toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-white/80">{acc.platform} Format</span>
                                            </div>
                                            <p className="text-xs text-white/60 line-clamp-6 leading-relaxed whitespace-pre-wrap">
                                                {formData.contentText || "Drafting..."}
                                            </p>
                                            {formData.mediaUrl && (
                                                <div className="mt-4 aspect-video w-full rounded-xl bg-black/40 border border-white/5 overflow-hidden relative">
                                                    <img src={formData.mediaUrl} className="w-full h-full object-cover opacity-70" />
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center border border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                            <p className="text-white/20 text-sm italic">Engine Interface Awaiting Setup...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
