
"use client"

import React, { useState, useEffect } from 'react'
import {
    Send,
    Calendar,
    Youtube,
    Users,
    Globe,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Image as ImageIcon,
    Type,
    Link as LinkIcon,
    Plus,
    X,
    Layout,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    Smartphone,
    RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * PRODUCTION-GRADE LINKEDIN POST CATEGORIES
 * Each maps to a specific LinkedIn UGC API strategy.
 */
const POST_CATEGORIES = [
    {
        id: 'TEXT',
        label: 'Text Only',
        icon: Type,
        hint: 'Best for stories & thoughts',
        constraint: 'Mandatory commentary text.',
        logic: 'shareMediaCategory: NONE',
        color: 'from-blue-500/20 to-blue-600/20',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'IMAGE',
        label: 'Image Post',
        icon: ImageIcon,
        hint: 'Professional visual assets',
        constraint: 'Support for multiple image asset URLs.',
        logic: 'shareMediaCategory: IMAGE',
        color: 'from-emerald-500/20 to-emerald-600/20',
        borderColor: 'border-emerald-500/30'
    },
    {
        id: 'VIDEO',
        label: 'Video Post',
        icon: Youtube,
        hint: 'External high-reach videos',
        constraint: 'YouTube optimization for embedded play.',
        logic: 'shareMediaCategory: ARTICLE',
        color: 'from-red-500/20 to-red-600/20',
        borderColor: 'border-red-500/30'
    },
    {
        id: 'IMAGE_TEXT',
        label: 'Image + Text',
        icon: Layout,
        hint: 'Combined visual engagement',
        constraint: 'Ensures both title, description, and media are sent in one block.',
        logic: 'Hybrid Mapping',
        color: 'from-purple-500/20 to-purple-600/20',
        borderColor: 'border-purple-500/30'
    },
    {
        id: 'VIDEO_TEXT',
        label: 'Video + Text',
        icon: Layout,
        hint: 'Contextual video sharing',
        constraint: 'Ensures both title, description, and media are sent in one block.',
        logic: 'Hybrid Mapping',
        color: 'from-orange-500/20 to-orange-600/20',
        borderColor: 'border-orange-500/30'
    },
    {
        id: 'GROUP',
        label: 'Group Post',
        icon: Users,
        hint: 'Direct targeted messaging',
        constraint: 'Correctly routes the post to a LinkedIn Group URN.',
        logic: 'containerEntity Targeting',
        color: 'from-pink-500/20 to-pink-600/20',
        borderColor: 'border-pink-500/30'
    },
]

export default function LinkedInPostPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccount, setSelectedAccount] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        youtubeUrl: '',
        title: searchParams.get('title') || '',
        description: searchParams.get('description') || '',
        targetType: 'FEED',
        groupIds: [] as string[],
        visibility: 'PUBLIC',
        scheduledAt: '',
        mediaUrls: searchParams.get('mediaUrl') ? [searchParams.get('mediaUrl')!] : [] as string[],
    })

    useEffect(() => {
        const title = searchParams.get('title')
        const desc = searchParams.get('description')
        const media = searchParams.get('mediaUrl')

        if (media) {
            setSelectedCategory('IMAGE_TEXT')
        } else if (desc || title) {
            setSelectedCategory('TEXT')
        }
    }, [searchParams])

    const [preview, setPreview] = useState<{ videoId?: string; thumbnail?: string } | null>(null)

    const [groups, setGroups] = useState<any[]>([])
    const [fetchingGroups, setFetchingGroups] = useState(false)
    const [groupError, setGroupError] = useState<string | null>(null)

    useEffect(() => {
        fetchAccounts()
    }, [])

    useEffect(() => {
        if (selectedAccount && selectedCategory === 'GROUP') {
            fetchGroups()
        }
    }, [selectedAccount, selectedCategory])

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            if (res.ok) {
                const data = await res.json()
                const linkedinAccounts = data.filter((acc: any) => acc.platform === 'linkedin')
                setAccounts(linkedinAccounts)
                if (linkedinAccounts.length > 0 && !selectedAccount) {
                    setSelectedAccount(linkedinAccounts[0].id)
                }
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error)
        }
    }

    const fetchGroups = async () => {
        if (!selectedAccount) return
        setFetchingGroups(true)
        setGroupError(null)
        try {
            const res = await fetch(`/api/linkedin/groups?accountId=${selectedAccount}`)
            const data = await res.json()
            if (res.ok) {
                setGroups(data.groups || [])
            } else {
                setGroupError(data.error || "Could not fetch groups")
            }
        } catch (error) {
            setGroupError("Failed to connect to group engine")
        } finally {
            setFetchingGroups(false)
        }
    }

    const handleYoutubeChange = (url: string) => {
        setFormData({ ...formData, youtubeUrl: url })
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
        const match = url.match(regExp)
        const videoId = (match && match[2].length === 11) ? match[2] : null

        if (videoId) {
            setPreview({
                videoId,
                thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
            })
        } else {
            setPreview(null)
        }
    }

    const addMediaUrl = () => {
        setFormData(prev => ({ ...prev, mediaUrls: [...prev.mediaUrls, ''] }))
    }

    const removeMediaUrl = (index: number) => {
        setFormData(prev => ({
            ...prev,
            mediaUrls: prev.mediaUrls.filter((_, i) => i !== index)
        }))
    }

    const updateMediaUrl = (index: number, val: string) => {
        const newUrls = [...formData.mediaUrls]
        newUrls[index] = val
        setFormData(prev => ({ ...prev, mediaUrls: newUrls }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAccount) {
            toast.error("Please select a LinkedIn account")
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/linkedin/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    postType: selectedCategory,
                    socialAccountId: selectedAccount,
                    thumbnailUrl: preview?.thumbnail || ''
                })
            })

            if (res.ok) {
                toast.success(formData.scheduledAt ? "Post scheduled successfully!" : "Post publishing initiated!")
                router.push('/dashboard/linkedin/control-panel')
            } else {
                const error = await res.json()
                throw new Error(error.error || "Failed to create post")
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }


    const currentCat = POST_CATEGORIES.find(c => c.id === selectedCategory)
    const currentAccount = accounts.find(a => a.id === selectedAccount)

    return (
        <div className="min-h-screen bg-[#020202] text-white overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full animate-pulse delay-700" />
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col gap-12">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/5">
                        <div className="space-y-4">
                            <Link href="/dashboard/linkedin/control-panel" className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all group">
                                <ArrowLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-medium tracking-tight">Return to Dashboard</span>
                            </Link>
                            <h1 className="text-5xl font-black tracking-tight leading-none bg-gradient-to-br from-white via-white to-white/20 bg-clip-text text-transparent">
                                Content Composer
                            </h1>
                            <p className="text-white/40 text-lg max-w-xl leading-relaxed">
                                Professional-grade LinkedIn engine supporting all major content strategies with real-time distribution.
                            </p>
                        </div>

                        {!selectedCategory && (
                            <div className="hidden lg:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-white/20 italic">
                                <span>Drafts Auto-Saved</span>
                                <div className="h-4 w-px bg-white/10" />
                                <span>Direct API Sync</span>
                            </div>
                        )}
                    </div>

                    {!selectedCategory ? (
                        /* SECTION 1: CATEGORY SELECTION */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {POST_CATEGORIES.map((cat, idx) => (
                                <button
                                    key={cat.id}
                                    onClick={() => {
                                        setSelectedCategory(cat.id);
                                        if (cat.id === 'GROUP') setFormData(f => ({ ...f, targetType: 'GROUP' }));
                                    }}
                                    className={cn(
                                        "relative group flex flex-col p-8 rounded-[2.5rem] border bg-white/5 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 active:scale-95 text-left overflow-hidden",
                                        cat.borderColor,
                                        "hover:bg-white/[0.08]"
                                    )}
                                >

                                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", cat.color)} />

                                    <div className="relative z-10">
                                        <div className="size-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-black/60 transition-all duration-500 shadow-2xl">
                                            <cat.icon className="size-7 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-black tracking-tight mb-2 group-hover:translate-x-1 transition-transform duration-500">{cat.label}</h3>
                                        <p className="text-white/40 text-sm mb-8 leading-relaxed font-medium">{cat.hint}</p>

                                        <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest mt-auto border-t border-white/5 pt-6 group-hover:text-white transition-colors">
                                            <span>Configure Strategy</span>
                                            <ChevronRight className="size-3 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        /* SECTION 2: COMPOSER STAGE */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 animate-in modal-in duration-500">
                            {/* Editor Panel */}
                            <div className="lg:col-span-7 space-y-10">
                                <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-500">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setSelectedCategory(null)}
                                        className="rounded-full size-12 border border-white/10 p-0 text-white/40 hover:text-white hover:bg-white/5"
                                    >
                                        <ArrowLeft className="size-5" />
                                    </Button>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Selected Strategy</span>
                                            <div className="h-px flex-1 bg-white/10" />
                                        </div>
                                        <h2 className="text-3xl font-black">{currentCat?.label}</h2>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-12">
                                    {/* 1. Identity Select */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black">01</div>
                                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Broadcasting Identity</Label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 size-8 rounded-full border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center">
                                                {currentAccount?.metadata?.picture ? (
                                                    <img src={currentAccount.metadata.picture} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="size-4 text-white/20 group-focus-within:text-blue-500 transition-colors" />
                                                )}
                                            </div>
                                            <select
                                                className="w-full bg-white/5 border border-white/10 rounded-3xl h-20 pl-18 pr-8 text-lg font-bold focus:ring-4 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer hover:bg-white/[0.08]"
                                                value={selectedAccount}
                                                onChange={(e) => setSelectedAccount(e.target.value)}
                                                required
                                            >
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id} className="bg-neutral-900 border-none">
                                                        {acc.metadata?.name || acc.metadata?.username || acc.platformAccountId}
                                                    </option>
                                                ))}

                                            </select>
                                        </div>
                                    </div>

                                    {/* 2. Content Engine */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black">02</div>
                                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Data Input & Logic</Label>
                                        </div>

                                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-10 shadow-inner">
                                            {/* Dynamic Field: Logic Hint */}
                                            <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="size-4 text-blue-400" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">API STRATEGY</span>
                                                        <span className="text-xs font-bold text-white/80">{currentCat?.logic}</span>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-[0.1em] text-blue-300">
                                                    Optimized
                                                </div>
                                            </div>

                                            {/* Dynamic Field: VIDEO / ARTICLE URL */}
                                            {['VIDEO', 'VIDEO_TEXT', 'GROUP'].includes(selectedCategory!) && (
                                                <div className="grid gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                        <span>Target URL</span>
                                                        <span className="text-red-500/50">Required</span>
                                                    </div>
                                                    <div className="relative group/field">
                                                        <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-white/20 group-focus-within/field:text-blue-500 transition-colors" />
                                                        <Input
                                                            placeholder="https://youtube.com/watch?v=..."
                                                            className="bg-black/60 border-white/10 h-16 pl-16 rounded-2xl text-lg font-medium focus:border-blue-500/50 focus:ring-4 ring-blue-500/5"
                                                            value={formData.youtubeUrl}
                                                            onChange={(e) => handleYoutubeChange(e.target.value)}
                                                            required={['VIDEO', 'VIDEO_TEXT'].includes(selectedCategory!)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Dynamic Field: IMAGES */}
                                            {['IMAGE', 'IMAGE_TEXT'].includes(selectedCategory!) && (
                                                <div className="grid gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                        <span>Media Assets</span>
                                                        <span className="text-emerald-500/50 italic">Multi-asset supported</span>
                                                    </div>
                                                    {formData.mediaUrls.map((url, i) => (
                                                        <div key={i} className="flex gap-3 group/asset">
                                                            <div className="relative flex-1">
                                                                <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-white/20 group-focus-within/asset:text-emerald-500 transition-colors" />
                                                                <Input
                                                                    placeholder="Direct image URL (JPG/PNG)..."
                                                                    className="bg-black/60 border-white/10 h-16 pl-16 rounded-2xl text-lg focus:border-emerald-500/50"
                                                                    value={url}
                                                                    onChange={(e) => updateMediaUrl(i, e.target.value)}
                                                                />
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                onClick={() => removeMediaUrl(i)}
                                                                className="h-16 w-16 rounded-2xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-red-400"
                                                            >
                                                                <X className="size-5" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        type="button"
                                                        onClick={addMediaUrl}
                                                        className="h-16 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-white/40 font-bold uppercase tracking-[0.1em] text-xs flex items-center justify-center gap-3"
                                                    >
                                                        <Plus className="size-4" /> Add Asset URN or URL
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Dynamic Field: TITLE */}
                                            {selectedCategory !== 'TEXT' && (
                                                <div className="grid gap-3 animate-in fade-in duration-700">
                                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                        <span>Broadcast Headline</span>
                                                        <span className={cn(formData.title.length > 200 ? "text-red-400" : "text-white/20")}>
                                                            {formData.title.length}/200
                                                        </span>
                                                    </div>
                                                    <Input
                                                        placeholder="Write a catchy professional hook..."
                                                        className="bg-black/60 border-white/10 h-16 px-6 rounded-2xl text-xl font-bold focus:border-blue-500/50"
                                                        value={formData.title}
                                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    />
                                                </div>
                                            )}

                                            {/* CORE FIELD: DESCRIPTION */}
                                            <div className="grid gap-3">
                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-white/60">
                                                    <span>Commentary Body</span>
                                                    <span className={cn(formData.description.length > 3000 ? "text-red-400" : "text-white/20")}>
                                                        {formData.description.length}/3000
                                                    </span>
                                                </div>
                                                <textarea
                                                    placeholder="Share your professional insights..."
                                                    className="w-full bg-black/60 border border-white/10 rounded-[2rem] min-h-[250px] p-8 text-xl font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/40 outline-none transition-all resize-none shadow-2xl placeholder:text-white/10"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    required={selectedCategory === 'TEXT'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 3. Distribution Panel */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-black">03</div>
                                            <Label className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Propagation Engine</Label>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                        <Globe className="size-5 text-blue-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase tracking-widest leading-none">Visibility</span>
                                                        <span className="text-[10px] text-white/20 mt-1">LinkedIn Network Privacy</span>
                                                    </div>
                                                </div>
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-4 text-sm font-bold outline-none cursor-pointer"
                                                    value={formData.visibility}
                                                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                                                >
                                                    <option value="PUBLIC" className="bg-neutral-900">Anyone (Default)</option>
                                                    <option value="CONTAINER" className="bg-neutral-900">Privately to Members</option>
                                                </select>
                                            </div>

                                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                                        <Calendar className="size-5 text-blue-400" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black uppercase tracking-widest leading-none">Timing</span>
                                                        <span className="text-[10px] text-white/20 mt-1">Background Scheduler</span>
                                                    </div>
                                                </div>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full bg-black/40 border border-white/10 rounded-2xl h-14 px-4 text-sm font-bold outline-none cursor-pointer invert opacity-70 focus:opacity-100 transition-opacity"
                                                    value={formData.scheduledAt}
                                                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        {selectedCategory === 'GROUP' && (
                                            <div className="animate-in slide-in-from-left-4 duration-500 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="size-4 text-pink-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">Target Community</span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={fetchGroups}
                                                        className="h-6 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white"
                                                    >
                                                        <RefreshCw className={cn("size-3 mr-2", fetchingGroups && "animate-spin")} />
                                                        Resync Groups
                                                    </Button>
                                                </div>

                                                {groupError ? (
                                                    <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 text-red-400">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <AlertCircle className="size-4" />
                                                            <span className="text-sm font-bold uppercase tracking-tight">Discovery Blocked</span>
                                                        </div>
                                                        <p className="text-xs opacity-70 leading-relaxed">
                                                            {groupError.includes('Insufficient permissions')
                                                                ? "Your LinkedIn App lacks Community Management permissions. Manual URN fallback recommended."
                                                                : groupError}
                                                        </p>
                                                        <div className="mt-4 relative group/fallback">
                                                            <Layout className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-pink-500/40" />
                                                            <Input
                                                                placeholder="Override with manual Group URN (urn:li:group:123)..."
                                                                className="bg-black/40 border-pink-500/20 h-16 pl-16 rounded-2xl text-sm focus:border-pink-500/50"
                                                                onChange={(e) => setFormData({ ...formData, groupIds: [e.target.value] })}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : fetchingGroups ? (
                                                    <div className="h-20 bg-white/5 animate-pulse rounded-3xl flex items-center justify-center border border-white/5">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Scanning memberships...</span>
                                                    </div>
                                                ) : groups.length === 0 ? (
                                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-center space-y-2">
                                                        <p className="text-xs text-white/40 font-bold uppercase tracking-widest">No Active Memberships Found</p>
                                                        <p className="text-[10px] text-white/20">Ensure you have 'ADMIN' or 'MEMBER' status in at least one LinkedIn Group.</p>
                                                    </div>
                                                ) : (
                                                    <div className="relative group">
                                                        <Users className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-pink-500" />
                                                        <select
                                                            className="w-full bg-pink-500/5 border border-pink-500/20 rounded-3xl h-20 pl-16 pr-8 text-lg font-bold text-pink-200 outline-none hover:bg-pink-500/10 transition-all appearance-none cursor-pointer"
                                                            onChange={(e) => setFormData({ ...formData, groupIds: [e.target.value] })}
                                                            required
                                                        >
                                                            <option value="" className="bg-neutral-900">Select Target Group...</option>
                                                            {groups.map(g => (
                                                                <option key={g.id} value={g.id} className="bg-neutral-900">
                                                                    {g.id.split(':').pop()} ({g.role})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-6 relative">
                                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-14 rounded-2xl shadow-lg active:scale-[0.98] transition-all uppercase tracking-widest text-xs group overflow-hidden relative"
                                        >
                                            <span className="relative z-10 flex items-center justify-center gap-4">
                                                {loading ? <Loader2 className="size-6 animate-spin" /> : (
                                                    formData.scheduledAt ? (
                                                        <>Queue Execution <Calendar className="size-5" /></>
                                                    ) : (
                                                        <>Authorize & Deploy <Send className="size-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" /></>
                                                    )
                                                )}
                                            </span>
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
                                        </Button>
                                    </div>
                                </form>
                            </div>

                            {/* Preview Engine (Sticky) */}
                            <div className="lg:col-span-5 hidden lg:block">
                                <div className="sticky top-12 space-y-8 animate-in slide-in-from-right-8 duration-1000">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Smartphone className="size-4 text-white/40" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none">Feed Simulation</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-[9px] font-black text-emerald-500/80 uppercase">Real-Time Sync</span>
                                        </div>
                                    </div>

                                    <Card className="bg-white text-black rounded-[2.5rem] border-none shadow-[0_60px_100px_-20px_rgba(0,0,0,0.8)] overflow-hidden scale-100 hover:scale-[1.01] transition-transform duration-700 ring-1 ring-white/10 group/preview">
                                        <div className="p-6 flex items-center gap-4 border-b border-slate-50">
                                            <div className="size-14 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative">
                                                {(currentAccount?.metadata?.picture || currentAccount?.metadata?.profilePicture || currentAccount?.metadata?.image) ? (
                                                    <img
                                                        src={currentAccount.metadata.picture || currentAccount.metadata.profilePicture || currentAccount.metadata.image}
                                                        alt="Me"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center font-bold text-slate-400">
                                                        {(currentAccount?.metadata?.name || currentAccount?.metadata?.username)?.[0] || 'U'}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-0.5 flex-1">
                                                <div className="text-sm font-bold text-slate-900">{currentAccount?.metadata?.name || currentAccount?.metadata?.username || 'LinkedIn User'}</div>
                                                <div className="text-[10px] text-slate-500 font-medium tracking-tight">Professional Broadcast • Now</div>
                                            </div>
                                            <Plus className="size-5 text-blue-600" />
                                        </div>

                                        <div className="p-6 pb-4 min-h-[100px]">
                                            {formData.description ? (
                                                <p className="text-[15px] leading-[1.6] line-clamp-[12] whitespace-pre-wrap text-slate-700 font-medium">
                                                    {formData.description}
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    <div className="h-3 w-full bg-slate-50 rounded" />
                                                    <div className="h-3 w-11/12 bg-slate-50 rounded" />
                                                    <div className="h-3 w-3/4 bg-slate-50 rounded opacity-50" />
                                                </div>
                                            )}
                                        </div>

                                        {selectedCategory !== 'TEXT' && (
                                            <div className="border-t border-slate-100 bg-slate-50/50 transition-all duration-700 group-hover/preview:bg-slate-50">
                                                {preview?.thumbnail ? (
                                                    <div className="relative aspect-video">
                                                        <img src={preview.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/10 group-hover/preview:bg-transparent transition-colors" />
                                                    </div>
                                                ) : formData.mediaUrls.length > 0 ? (
                                                    <div className={cn(
                                                        "grid gap-0.5 aspect-video overflow-hidden bg-slate-100",
                                                        formData.mediaUrls.length === 1 ? "grid-cols-1" :
                                                            formData.mediaUrls.length === 2 ? "grid-cols-2" :
                                                                "grid-cols-2 grid-rows-2"
                                                    )}>
                                                        {formData.mediaUrls.slice(0, 4).map((url, i) => (
                                                            <div key={i} className={cn(
                                                                "relative h-full",
                                                                formData.mediaUrls.length === 3 && i === 0 ? "row-span-2" : ""
                                                            )}>
                                                                {url ? (
                                                                    <img src={url} alt={`Asset ${i}`} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                                                        <ImageIcon className="size-4 text-slate-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {formData.mediaUrls.length > 4 && (
                                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md">
                                                                +{formData.mediaUrls.length - 4} more
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video bg-slate-100/50 flex flex-col items-center justify-center gap-3">
                                                        <div className="size-16 rounded-full bg-white flex items-center justify-center shadow-lg transform group-hover/preview:scale-110 transition-transform duration-700">
                                                            {selectedCategory === 'IMAGE' ? <ImageIcon className="size-6 text-slate-300" /> : <LinkIcon className="size-6 text-slate-300" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Placeholder</span>
                                                    </div>
                                                )}

                                                <div className="p-6 pb-8 space-y-2 bg-white">
                                                    <h3 className="font-black text-lg line-clamp-2 leading-[1.3] text-slate-900 group-hover/preview:text-blue-700 transition-colors">
                                                        {formData.title || 'Broadcast Title Placeholder'}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-2 rounded-full bg-blue-600" />
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{currentCat?.label} STRATEGY</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-2 px-6 border-t border-slate-50 flex justify-between bg-white text-[12px] font-black text-slate-400 uppercase tracking-tighter">
                                            {['Like', 'Comment', 'Repost', 'Send'].map(action => (
                                                <div key={action} className="px-4 py-4 flex items-center gap-2 opacity-40 hover:opacity-100 hover:text-blue-600 transition-all cursor-not-allowed">
                                                    <div className="size-4 rounded-sm border-2 border-slate-100" />
                                                    {action}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    {/* Strategy Info */}
                                    <div className="p-8 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/5 space-y-6 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-5">
                                            <ShieldCheck className="size-20" />
                                        </div>
                                        <div className="flex items-center gap-3 text-white/60">
                                            <ShieldCheck className="size-4 text-emerald-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Security Assertion</h4>
                                        </div>
                                        <div className="space-y-4 relative z-10">
                                            <p className="text-sm text-white/30 leading-relaxed font-medium">
                                                Constraint: <span className="text-emerald-500/60 italic">"{currentCat?.constraint}"</span>
                                            </p>
                                            <p className="text-[11px] text-white/20 leading-relaxed">
                                                This broadcast follows ISO-compliant automation patterns. Your tokens are encrypted with AES-256 and stored in stateless isolated environments.
                                            </p>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full w-1/3 bg-emerald-500/20 group-hover:w-full transition-all duration-[3000ms]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
