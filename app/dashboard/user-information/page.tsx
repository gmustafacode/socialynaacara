"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
    Loader2, User, Building2, Sparkles, Target, Zap, Clock, ShieldCheck,
    Share2, ImageIcon, Video, AlignLeft, Layout, Users, Globe, Save,
    RotateCcw, Check, Plus, Trash2, Hash, MessageSquare, Smile, SmilePlus,
    Settings2, BookOpen, ChevronDown, TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Constants ─────────────────────────────────────────────────────────────

const PLATFORMS = [
    { id: "linkedin", label: "LinkedIn", icon: Share2, color: "blue" },
    { id: "instagram", label: "Instagram", icon: ImageIcon, color: "pink" },
    { id: "tiktok", label: "TikTok", icon: Video, color: "cyan" },
    { id: "facebook", label: "Facebook", icon: Layout, color: "indigo" },
    { id: "telegram", label: "Telegram", icon: Globe, color: "sky" },
] as const

const UNIVERSAL_POST_TYPES = [
    { id: "text_only", label: "Text Only", icon: AlignLeft, desc: "Pure text content. No media." },
    { id: "image_only", label: "Image Only", icon: ImageIcon, desc: "Image with a short caption." },
    { id: "text_image", label: "Text + Image", icon: Layout, desc: "Full text post with supporting image." },
    { id: "text_video", label: "Text + Video", icon: Video, desc: "Post with an accompanying video." },
    { id: "group", label: "Group Posts", icon: Users, desc: "Community-style discussion post." },
] as const

const TONES = ["Formal", "Casual", "Friendly", "Professional"] as const
const CAPTION_LENGTHS = ["Short", "Medium", "Long"] as const
const HASHTAG_INTENSITIES = ["Low", "Medium", "High"] as const

const platformColorMap: Record<string, string> = {
    blue: "border-blue-500 bg-blue-500/10",
    pink: "border-pink-500 bg-pink-500/10",
    cyan: "border-cyan-500 bg-cyan-500/10",
    indigo: "border-indigo-500 bg-indigo-500/10",
    sky: "border-sky-500 bg-sky-500/10",
}

// ─── Component ─────────────────────────────────────────────────────────────

export default function UserInformationPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<any>(null)

    useEffect(() => { if (session?.user) fetchPreferences() }, [session])

    const fetchPreferences = async () => {
        try {
            const res = await fetch(`/api/preferences/${(session?.user as any)?.id}`)
            if (res.ok) {
                const data = await res.json()
                const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
                setFormData({ ...data, timezone: data?.timezone || detectedTz })
            }
        } catch { toast.error("Failed to fetch profile info") }
        finally { setLoading(false) }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/preferences/${(session?.user as any)?.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })
            if (res.ok) toast.success("Profile updated successfully")
            else throw new Error()
        } catch { toast.error("Failed to save changes") }
        finally { setSaving(false) }
    }

    const set = (key: string, val: any) => setFormData((p: any) => ({ ...p, [key]: val }))

    const toggleArray = (field: string, id: string) => {
        const cur = (formData?.[field] || []) as string[]
        set(field, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])
    }

    const setPlatformPref = (platformId: string, key: string, val: any) => {
        const cur = formData?.platformPreferences || {}
        set("platformPreferences", { ...cur, [platformId]: { ...(cur[platformId] || {}), [key]: val } })
    }

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="animate-spin text-purple-500 size-8" />
        </div>
    )

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">

            {/* ─── Header ─────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Settings2 className="size-8 text-purple-400" />
                        Control Center
                    </h2>
                    <p className="text-white/50 mt-1 text-sm">
                        Every automation preference, in one place. Changes apply to the entire pipeline.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 bg-white/5 text-white" onClick={fetchPreferences}>
                        <RotateCcw className="size-4 mr-2" /> Reset
                    </Button>
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                        Save All
                    </Button>
                </div>
            </div>

            {/* ─── Pipeline Banner ─────────────────────────────────── */}
            <div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-300 overflow-x-auto">
                {["Intake", "Discovery", "Research", "Media", "Generate", "Optimize", "Safety", "Publish", "Analytics"].map((step, i, arr) => (
                    <span key={step} className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 font-medium">{step}</span>
                        {i < arr.length - 1 && <span className="text-purple-500/50">→</span>}
                    </span>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* ─── 1. Profile ─────────────────────────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <User className="size-5 text-purple-400" /> Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Full Name</Label>
                            <Input value={(session?.user as any)?.name || "—"} disabled className="bg-white/5 border-white/10 text-white/50 cursor-not-allowed" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Brand / Company Name</Label>
                            <Input
                                placeholder="Your brand name..."
                                value={formData?.brandName || ""}
                                onChange={e => set("brandName", e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Profile Type</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["Personal", "Business", "Creator"] as const).map(type => (
                                    <button key={type} type="button" onClick={() => set("profileType", type)} className={cn(
                                        "relative p-3 rounded-xl border transition-all flex flex-col items-center gap-1.5",
                                        formData?.profileType === type
                                            ? "border-purple-500 bg-purple-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/30"
                                    )}>
                                        {type === "Personal" && <User className="size-4" />}
                                        {type === "Business" && <Building2 className="size-4" />}
                                        {type === "Creator" && <Sparkles className="size-4" />}
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{type}</span>
                                        {formData?.profileType === type && <Check className="absolute top-1 right-1 size-3 text-purple-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── 2. Audience & Goals ─────────────────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Target className="size-5 text-blue-400" /> Audience & Goals
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Target Audience</Label>
                            <Input
                                placeholder="e.g. Tech founders, marketers, students..."
                                value={formData?.audienceType || ""}
                                onChange={e => set("audienceType", e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Industry / Niche</Label>
                            <Input
                                placeholder="e.g. SaaS, AI, Finance, Health..."
                                value={formData?.industryNiche || ""}
                                onChange={e => set("industryNiche", e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Content Goals</Label>
                            <Input
                                placeholder="e.g. Build brand awareness, drive leads..."
                                value={formData?.contentGoals || ""}
                                onChange={e => set("contentGoals", e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ─── 3. Universal Post Types ─────────────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="size-5 text-orange-400" /> Content Automation Preferences
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                            Select the post types the AI will use in the automation pipeline. Multi-select allowed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {UNIVERSAL_POST_TYPES.map(type => {
                                const active = (formData?.preferredContentTypes || []).includes(type.id)
                                return (
                                    <button key={type.id} type="button" onClick={() => toggleArray("preferredContentTypes", type.id)} className={cn(
                                        "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center group",
                                        active
                                            ? "border-orange-500 bg-orange-500/15 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/20"
                                    )}>
                                        <type.icon className={cn("size-6 transition-colors", active ? "text-orange-400" : "text-white/30 group-hover:text-white/60")} />
                                        <span className="text-xs font-semibold leading-tight">{type.label}</span>
                                        <span className="text-[10px] text-white/40 leading-tight">{type.desc}</span>
                                        {active && <Check className="absolute top-2 right-2 size-3 text-orange-400" />}
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ─── 4. Emoji & Style Preferences ───────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <SmilePlus className="size-5 text-yellow-400" /> Emoji & Style Preferences
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                            These directly influence how the AI writes your content.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Use Emojis */}
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">
                                <Smile className="size-3 inline mr-1" />Use Emojis?
                            </Label>
                            <div className="flex gap-2">
                                {[{ label: "Yes", val: true }, { label: "No", val: false }].map(opt => (
                                    <button key={String(opt.label)} type="button" onClick={() => set("useEmojis", opt.val)} className={cn(
                                        "flex-1 p-2.5 rounded-lg border text-sm font-semibold transition-all",
                                        formData?.useEmojis === opt.val
                                            ? "border-yellow-500 bg-yellow-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}>{opt.label}</button>
                                ))}
                            </div>
                        </div>
                        {/* Tone */}
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">
                                <MessageSquare className="size-3 inline mr-1" />Content Tone
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {TONES.map(tone => (
                                    <button key={tone} type="button" onClick={() => set("contentTone", tone)} className={cn(
                                        "p-2.5 rounded-lg border text-xs font-semibold transition-all",
                                        formData?.contentTone === tone
                                            ? "border-purple-500 bg-purple-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}>{tone}</button>
                                ))}
                            </div>
                        </div>
                        {/* Caption Length */}
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">
                                <AlignLeft className="size-3 inline mr-1" />Caption Length
                            </Label>
                            <div className="flex gap-2">
                                {CAPTION_LENGTHS.map(len => (
                                    <button key={len} type="button" onClick={() => set("captionLength", len)} className={cn(
                                        "flex-1 p-2.5 rounded-lg border text-xs font-semibold transition-all",
                                        formData?.captionLength === len
                                            ? "border-blue-500 bg-blue-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}>{len}</button>
                                ))}
                            </div>
                        </div>
                        {/* Hashtag Intensity */}
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">
                                <Hash className="size-3 inline mr-1" />Hashtag Intensity
                            </Label>
                            <div className="flex gap-2">
                                {HASHTAG_INTENSITIES.map(h => (
                                    <button key={h} type="button" onClick={() => set("hashtagIntensity", h)} className={cn(
                                        "flex-1 p-2.5 rounded-lg border text-xs font-semibold transition-all",
                                        formData?.hashtagIntensity === h
                                            ? "border-emerald-500 bg-emerald-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}>
                                        {h === "Low" ? "1-2 tags" : h === "Medium" ? "3-5 tags" : "6-10 tags"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ─── 5. Platform Control ─────────────────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Globe className="size-5 text-emerald-400" /> Platform Control
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">
                            Only enabled platforms will receive posts. Disabled platforms are completely excluded.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {PLATFORMS.map(platform => {
                            const pPref = formData?.platformPreferences?.[platform.id] || {}
                            const isEnabled = pPref.enabled !== false
                            return (
                                <div key={platform.id} className={cn(
                                    "rounded-xl border p-3 transition-all",
                                    isEnabled ? platformColorMap[platform.color] : "border-white/5 bg-white/3 opacity-60"
                                )}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <platform.icon className="size-4 text-white/70" />
                                            <span className="text-sm font-semibold">{platform.label}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setPlatformPref(platform.id, "enabled", !isEnabled)}
                                            className={cn(
                                                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                                                isEnabled ? "bg-emerald-500" : "bg-white/20"
                                            )}
                                        >
                                            <span className={cn(
                                                "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                                                isEnabled ? "translate-x-5" : "translate-x-1"
                                            )} />
                                        </button>
                                    </div>
                                    {isEnabled && (
                                        <div className="flex gap-1.5 flex-wrap">
                                            {["text_only", "image_only", "text_image", "text_video"].map(ct => {
                                                const ctEnabled = (pPref.contentTypes || []).includes(ct)
                                                return (
                                                    <button key={ct} type="button" onClick={() => {
                                                        const cur: string[] = pPref.contentTypes || []
                                                        const next = ctEnabled ? cur.filter(x => x !== ct) : [...cur, ct]
                                                        setPlatformPref(platform.id, "contentTypes", next)
                                                    }} className={cn(
                                                        "px-2 py-0.5 rounded text-[10px] font-semibold border transition-all",
                                                        ctEnabled
                                                            ? "border-white/30 bg-white/20 text-white"
                                                            : "border-white/10 bg-transparent text-white/40 hover:text-white"
                                                    )}>
                                                        {ct.replace("_", "+")}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                {/* ─── 6. Posting Behavior ─────────────────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Clock className="size-5 text-red-400" /> Posting Behavior
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Automation Level */}
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">Automation Level</Label>
                            <div className="flex gap-3">
                                {[
                                    { level: "Manual", hint: "You post manually; AI assists but does not act.", icon: User },
                                    { level: "Semi-Auto", hint: "AI generates content. You review before publishing.", icon: ShieldCheck },
                                    { level: "Full Auto", hint: "AI generates, approves, and publishes automatically.", icon: TrendingUp },
                                ].map(({ level, hint, icon: Icon }) => (
                                    <button key={level} type="button" onClick={() => set("automationLevel", level)} className={cn(
                                        "relative flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-2",
                                        formData?.automationLevel === level
                                            ? "border-red-500 bg-red-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}>
                                        <Icon className={cn("size-5", formData?.automationLevel === level ? "text-red-400" : "text-white/20")} />
                                        <span className="text-xs font-black uppercase tracking-tight">{level}</span>
                                        <span className="text-[9px] text-white/40 text-center leading-tight">{hint}</span>
                                        {formData?.automationLevel === level && <Check className="absolute top-2 right-2 size-3 text-red-500" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Posting Schedule */}
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-white/70 text-xs uppercase tracking-wider">Posting Schedule Triggers</Label>
                                <Button type="button" variant="outline" size="sm" onClick={() => {
                                    const cur = Array.isArray(formData?.postingSchedule) ? formData.postingSchedule : []
                                    set("postingSchedule", [...cur, { day: "Everyday", time: "12:00" }])
                                }} className="h-7 text-xs border-white/10 bg-white/5 text-white">
                                    <Plus className="size-3 mr-1" /> Add Trigger
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {(Array.isArray(formData?.postingSchedule) ? formData.postingSchedule : []).map((schedule: any, i: number) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <select
                                            value={schedule.day}
                                            onChange={e => {
                                                const cur = [...formData.postingSchedule]
                                                cur[i].day = e.target.value
                                                set("postingSchedule", cur)
                                            }}
                                            className="flex h-9 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        >
                                            {["Everyday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                                                <option key={day} value={day} className="bg-neutral-900">{day}</option>
                                            ))}
                                        </select>
                                        <Input type="time" value={schedule.time} onChange={e => {
                                            const cur = [...formData.postingSchedule]
                                            cur[i].time = e.target.value
                                            set("postingSchedule", cur)
                                        }} className="bg-white/5 border-white/10 w-32 text-white" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => {
                                            const cur = [...formData.postingSchedule]
                                            cur.splice(i, 1)
                                            set("postingSchedule", cur)
                                        }} className="text-white/40 hover:text-red-400 hover:bg-red-400/10 shrink-0">
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                                {(!Array.isArray(formData?.postingSchedule) || formData.postingSchedule.length === 0) && (
                                    <p className="text-xs text-white/30 text-center py-3 border border-dashed border-white/10 rounded-md">
                                        No triggers set. Click 'Add Trigger' to schedule posts.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Posting Frequency */}
                        <div className="grid gap-2">
                            <Label className="text-white/70 text-xs uppercase tracking-wider">
                                <Clock className="size-3 inline mr-1" />Posting Frequency
                            </Label>
                            <div className="grid grid-cols-4 gap-2">
                                {["Daily", "3x/week", "Weekly", "Custom"].map(freq => (
                                    <button key={freq} type="button" onClick={() => set("postingFrequency", freq)} className={cn(
                                        "p-2.5 rounded-lg border text-xs font-semibold transition-all",
                                        formData?.postingFrequency === freq
                                            ? "border-orange-500 bg-orange-500/20 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}>{freq}</button>
                                ))}
                            </div>
                        </div>

                        {/* Timezone + Notifications — side by side */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-white/70 text-xs uppercase tracking-wider">
                                    <Globe className="size-3 inline mr-1" />Timezone
                                </Label>
                                <Input
                                    value={formData?.timezone || ""}
                                    onChange={e => set("timezone", e.target.value)}
                                    placeholder="e.g. Asia/Karachi"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs"
                                />
                                <p className="text-[10px] text-white/30">
                                    Auto-detected: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-white/70 text-xs uppercase tracking-wider">
                                    Notifications
                                </Label>
                                <div className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5 h-9 mt-0.5">
                                    <span className="text-xs text-white/60 flex-1">Email & In-App Alerts</span>
                                    <button
                                        type="button"
                                        onClick={() => set("notificationsEnabled", !formData?.notificationsEnabled)}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0",
                                            formData?.notificationsEnabled !== false ? "bg-emerald-500" : "bg-white/20"
                                        )}
                                    >
                                        <span className={cn(
                                            "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                                            formData?.notificationsEnabled !== false ? "translate-x-5" : "translate-x-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>


                {/* ─── 7. Quick Navigation Hub ─────────────────────── */}
                <Card className="border-white/10 bg-neutral-900/80 text-white backdrop-blur-sm md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BookOpen className="size-5 text-blue-400" /> Quick Access
                        </CardTitle>
                        <CardDescription className="text-white/50 text-xs">Jump to platform-specific automation composers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {PLATFORMS.map(platform => (
                                <Button key={platform.id} variant="outline" onClick={() => router.push(`/dashboard/composer/universal`)}
                                    className="h-20 flex flex-col gap-1.5 border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all rounded-2xl text-white">
                                    <platform.icon className="size-5 text-purple-400" />
                                    <span className="text-xs font-bold">{platform.label}</span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}
