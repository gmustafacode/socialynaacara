"use client"

import React, { useState, useEffect } from 'react'
import {
    Send,
    Globe,
    Layout,
    Type,
    Image as ImageIcon,
    Loader2,
    ArrowLeft,
    Monitor,
    Shield
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
    const [selectedAccount, setSelectedAccount] = useState('')

    const [formData, setFormData] = useState({
        contentText: '',
        mediaUrl: '',
        scheduledAt: '',
        postType: 'TEXT',
        targetType: 'FEED'
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
                    setSelectedAccount(data[0].id)
                }
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAccount) {
            toast.error("Please select an account")
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

            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    socialAccountId: selectedAccount,
                    publishNow: !formData.scheduledAt
                })
            })

            if (res.ok) {
                toast.success(formData.scheduledAt ? "Post scheduled! (Will be processed in our next 10-min window)" : "Cross-platform transmission active!")
                router.push('/dashboard/queue')
            } else {
                const error = await res.json()
                throw new Error(error.error || "Failed to initiate transmission")
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    const currentAccount = accounts.find(a => a.id === selectedAccount)

    return (
        <div className="min-h-screen bg-black text-white p-6 space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                <div className="space-y-4">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all group">
                        <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Hub</span>
                    </Link>
                    <h1 className="text-5xl font-black tracking-tight leading-none bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
                        Cross-Platform Engine
                    </h1>
                    <p className="text-white/40 text-lg max-w-xl leading-relaxed">
                        Post to non-LinkedIn platforms (X, Instagram, TikTok, etc.) via n8n webhook integration.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                    <Shield className="size-4 text-purple-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60 text-purple-400">Secure Webhook Layer Active</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                {/* Editor */}
                <Card className="lg:col-span-7 bg-white/[0.02] border-white/5 rounded-[2.5rem] overflow-hidden">
                    <CardContent className="p-10">
                        <form onSubmit={handleSubmit} className="space-y-10">
                            {/* Account Select */}
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-white/20">Target Platform & Identity</Label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl h-16 px-6 text-lg font-bold outline-none focus:border-purple-500/50 appearance-none cursor-pointer"
                                    value={selectedAccount}
                                    onChange={(e) => setSelectedAccount(e.target.value)}
                                    required
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="bg-neutral-900 border-none">
                                            {acc.platform.toUpperCase()} - {acc.metadata?.name || acc.metadata?.username || acc.platformAccountId}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/20">Raw Payload</Label>
                                    <span className="text-[10px] font-black text-white/10">{formData.contentText.length} Characters</span>
                                </div>
                                <textarea
                                    placeholder="Input your transmission data here..."
                                    className="w-full bg-black/40 border border-white/10 rounded-3xl min-h-[250px] p-8 text-xl font-medium focus:border-purple-500/50 outline-none transition-all resize-none shadow-2xl"
                                    value={formData.contentText}
                                    onChange={(e) => setFormData({ ...formData, contentText: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Media & Type */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/20">Media Resource (URL)</Label>
                                    <div className="relative group">
                                        <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-white/20 group-focus-within:text-purple-400" />
                                        <Input
                                            placeholder="https://..."
                                            className="bg-black/40 border-white/10 h-16 pl-16 rounded-2xl font-bold"
                                            value={formData.mediaUrl}
                                            onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-white/20">Execution Delay (Optional)</Label>
                                    <Input
                                        type="datetime-local"
                                        className="bg-black/40 border-white/10 h-16 px-6 rounded-2xl font-bold invert opacity-70"
                                        value={formData.scheduledAt}
                                        onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                    />
                                    <p className="text-[10px] text-white/20 mt-2 italic px-2">
                                        Note: Posts are dispatched in 10-minute windows (±5 mins) to optimize delivery.
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 h-16 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-purple-900/20 active:scale-[0.98] transition-all"
                            >
                                {loading ? <Loader2 className="animate-spin text-white" /> : (
                                    <div className="flex items-center gap-3">
                                        Send via Webhook <Send className="size-4" />
                                    </div>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Preview / Info */}
                <div className="lg:col-span-5 space-y-8">
                    <Card className="bg-neutral-900 border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Monitor className="size-5 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Transmission Preview</h3>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Mock Distribution State</p>
                                </div>
                            </div>

                            <div className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">
                                        {currentAccount?.platform?.substring(0, 1).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold">{currentAccount?.metadata?.name || "Target Hub"}</span>
                                        <span className="text-[9px] text-white/20 uppercase tracking-widest">Awaiting Payload</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm text-white/60 line-clamp-4 break-words leading-relaxed italic">
                                        {formData.contentText || "No content detected..."}
                                    </p>
                                    {formData.mediaUrl && (
                                        <div className="aspect-video w-full rounded-xl bg-white/5 flex items-center justify-center overflow-hidden">
                                            <img src={formData.mediaUrl} className="w-full h-full object-cover opacity-50" onError={(e) => e.currentTarget.style.display = 'none'} />
                                            <ImageIcon className="absolute size-4 text-white/10" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400/80">Engine Type</span>
                                    <span className="text-xs font-bold">n8n Managed</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">Protocol</span>
                                    <span className="text-xs font-bold text-blue-400">Webhook Async</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                            <Shield className="size-4 text-emerald-500" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest">Enterprise Assertion</h4>
                        </div>
                        <p className="text-[11px] text-white/20 leading-relaxed">
                            Universal engine broadcasts utilize isolated HTTP environments to deliver content across non-native platforms. Credentials are never shared directly with third-party webhooks.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
