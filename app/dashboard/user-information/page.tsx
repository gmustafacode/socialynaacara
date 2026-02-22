"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, User, Building2, Sparkles, Target, Zap, Clock, ShieldCheck, Share2, ImageIcon, Video, AlignLeft, Layout, Users, Globe, Save, RotateCcw, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const PLATFORMS = [
    { id: "linkedin", label: "LinkedIn", icon: Share2 },
    { id: "instagram", label: "Instagram", icon: ImageIcon },
    { id: "tiktok", label: "TikTok", icon: Video },
    { id: "facebook", label: "Facebook", icon: Layout },
    { id: "telegram", label: "Telegram", icon: Globe },
]

const CONTENT_TYPES = [
    { id: "text", label: "Text", icon: AlignLeft },
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "video", label: "Video", icon: Video },
    { id: "mixed", label: "Mixed", icon: Layout },
    { id: "carousel", label: "Carousel", icon: Layout },
    { id: "group", label: "Group", icon: Users },
]

export default function UserInformationPage() {
    const { data: session } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState<any>(null)

    useEffect(() => {
        if (session?.user) {
            fetchPreferences()
        }
    }, [session])

    const fetchPreferences = async () => {
        try {
            const res = await fetch(`/api/preferences/${(session?.user as any)?.id}`)
            if (res.ok) {
                const data = await res.json()
                setFormData(data)
            }
        } catch (error) {
            toast.error("Failed to fetch profile info")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/preferences/${(session?.user as any)?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                toast.success("Profile updated successfully")
            } else {
                throw new Error()
            }
        } catch (error) {
            toast.error("Failed to save changes")
        } finally {
            setSaving(false)
        }
    }

    const toggleMultiSelect = (field: string, id: string) => {
        const current = formData[field] || []
        const updated = current.includes(id)
            ? current.filter((i: string) => i !== id)
            : [...current, id]
        setFormData({ ...formData, [field]: updated })
    }

    if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white">User Information</h2>
                    <p className="text-white/60">Manage your profile, audience data, and automation preferences.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-white/10 bg-white/5" onClick={fetchPreferences}>
                        <RotateCcw className="size-4 mr-2" /> Reset
                    </Button>
                    <Button className="bg-white text-black hover:bg-neutral-200" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Info */}
                <Card className="border-white/10 bg-neutral-900 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5 text-purple-400" /> Basic Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Brand/Company Name</Label>
                            <Input
                                value={formData?.brandName || ""}
                                onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Profile Type</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {["Personal", "Business", "Creator"].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, profileType: type })}
                                        className={cn(
                                            "relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2",
                                            formData?.profileType === type
                                                ? "border-purple-500 bg-purple-500/20 text-white"
                                                : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                        )}
                                    >
                                        {type === "Personal" && <User className="size-4" />}
                                        {type === "Business" && <Building2 className="size-4" />}
                                        {type === "Creator" && <Sparkles className="size-4" />}
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">{type}</span>
                                        {formData?.profileType === type && (
                                            <Check className="absolute top-1 right-1 size-3 text-purple-400" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audience Info */}
                <Card className="border-white/10 bg-neutral-900 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="size-5 text-blue-400" /> Audience & Niche
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Target Audience</Label>
                            <Input
                                value={formData?.audienceType || ""}
                                onChange={e => setFormData({ ...formData, audienceType: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Industry / Niche</Label>
                            <Input
                                value={formData?.industryNiche || ""}
                                onChange={e => setFormData({ ...formData, industryNiche: e.target.value })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Preferences */}
                <Card className="border-white/10 bg-neutral-900 text-white md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="size-5 text-emerald-400" /> Platform Preferences
                        </CardTitle>
                        <CardDescription>Which social media platforms do you use for automation?</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {PLATFORMS.map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => toggleMultiSelect('preferredPlatforms', platform.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full border transition-all",
                                        formData?.preferredPlatforms?.includes(platform.id)
                                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}
                                >
                                    <platform.icon className="size-4" />
                                    <span className="text-sm">{platform.label}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Content Preferences */}
                <Card className="border-white/10 bg-neutral-900 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="size-5 text-orange-400" /> Content Preferences
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                            {CONTENT_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => toggleMultiSelect('preferredContentTypes', type.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                                        formData?.preferredContentTypes?.includes(type.id)
                                            ? "border-orange-500 bg-orange-500/10 text-white"
                                            : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                    )}
                                >
                                    <type.icon className="size-4" />
                                    <span className="text-xs font-medium">{type.label}</span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Posting Behavior */}
                <Card className="border-white/10 bg-neutral-900 text-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="size-5 text-red-400" /> Posting Behavior
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Automation Level</Label>
                            <div className="flex gap-2">
                                {["Manual", "Semi-Auto", "Full Auto"].map(level => (
                                    <button
                                        key={level}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, automationLevel: level })}
                                        className={cn(
                                            "relative flex-1 p-3 rounded-xl border transition-all flex flex-col items-center gap-1",
                                            formData?.automationLevel === level
                                                ? "border-red-500 bg-red-500/20 text-white"
                                                : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                                        )}
                                    >
                                        <ShieldCheck className={cn("size-4", formData?.automationLevel === level ? "text-red-400" : "text-white/20")} />
                                        <span className="text-[9px] font-black uppercase tracking-tight">{level}</span>
                                        {formData?.automationLevel === level && (
                                            <Check className="absolute top-1 right-1 size-3 text-red-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 p-2 rounded bg-white/5 border border-white/5">
                                {formData?.automationLevel === "Manual" && (
                                    <p className="text-[10px] text-white/40 italic">You must post manually; AI will not take actions.</p>
                                )}
                                {formData?.automationLevel === "Semi-Auto" && (
                                    <p className="text-[10px] text-white/40 italic">Posts must be approved before publishing, or they will be delayed.</p>
                                )}
                                {formData?.automationLevel === "Full Auto" && (
                                    <p className="text-[10px] text-white/40 italic">Posts will publish automatically at preferred time; no manual check needed.</p>
                                )}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Preferred Time</Label>
                            <Input
                                value={typeof formData?.preferredPostingTimes === 'object' ? formData.preferredPostingTimes.time : formData?.preferredPostingTimes}
                                onChange={e => setFormData({ ...formData, preferredPostingTimes: { time: e.target.value } })}
                                className="bg-white/5 border-white/10"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Navigation Hub */}
                <Card className="border-white/10 bg-neutral-900 text-white md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Share2 className="size-5 text-blue-400" /> Platform Navigation Hub
                        </CardTitle>
                        <CardDescription>Quick access to specialized automation composers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {PLATFORMS.map(platform => (
                                <Button
                                    key={platform.id}
                                    variant="outline"
                                    className="h-24 flex flex-col gap-2 border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all rounded-2xl"
                                    onClick={() => router.push(`/dashboard/composer/universal`)}
                                >
                                    <platform.icon className="size-6 text-purple-400" />
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
