"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2, Command, Check, ChevronRight, ChevronLeft, Building2, User, Sparkles, Globe, Monitor, Video, AlignLeft, Image as ImageIcon, Layout, Users, Megaphone, Target, Clock, Zap, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const STEPS = [
    { id: 1, title: "Basic Profile", description: "Who are you?" },
    { id: 2, title: "Audience & Interests", description: "What's your niche?" },
    { id: 3, title: "Platforms", description: "Where do you post?" },
    { id: 4, title: "Content Preferences", description: "How do you post?" },
    { id: 5, title: "Behavior", description: "When do you post?" }
]

const PLATFORMS = [
    { id: "linkedin", label: "LinkedIn", icon: Share2 },
    { id: "instagram", label: "Instagram", icon: ImageIcon },
    { id: "tiktok", label: "TikTok", icon: Video },
    { id: "facebook", label: "Facebook", icon: Layout },
    { id: "telegram", label: "Telegram", icon: Globe },
    { id: "others", label: "Others", icon: Sparkles },
]

const CONTENT_TYPES = [
    { id: "text", label: "Text posts", icon: AlignLeft },
    { id: "image", label: "Image posts", icon: ImageIcon },
    { id: "video", label: "Video posts", icon: Video },
    { id: "mixed", label: "Mixed posts", icon: Layout },
    { id: "carousel", label: "Carousel posts", icon: Layout },
    { id: "group", label: "Group posts", icon: Users },
]

import { Share2 } from "lucide-react"

export default function OnboardingPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [currentStep, setCurrentStep] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        brandName: "",
        profileType: "Personal",
        audienceType: "",
        industryNiche: "",
        contentGoals: "",
        preferredPlatforms: [] as string[],
        preferredContentTypes: [] as string[],
        postingFrequency: "Daily",
        automationLevel: "Semi-Auto",
        preferredPostingTimes: "Morning"
    })

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
        if (session?.user?.name && !formData.name) {
            setFormData(prev => ({ ...prev, name: session.user?.name || "" }))
        }
    }, [status, session, router, formData.name])

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

    const handleSkip = async () => {
        setIsLoading(true)
        try {
            await savePreferences(true)
            toast.info("Onboarding skipped. You can complete your profile later.")
            router.push("/dashboard")
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const savePreferences = async (isCompleted = false) => {
        const userId = (session?.user as any)?.id
        if (!userId) return

        const res = await fetch(`/api/preferences/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                onboardingCompleted: isCompleted,
                // Ensure platforms and types are saved as JSON strings for the current schema if not migrated yet
                // But the plan is to update the API to handle these properly
            })
        })

        if (!res.ok) throw new Error("Failed to save")
        return await res.json()
    }

    const handleFinish = async () => {
        setIsLoading(true)
        try {
            await savePreferences(true)
            toast.success("Welcome aboard!")
            router.push("/dashboard")
        } catch (error) {
            toast.error("Failed to complete onboarding")
        } finally {
            setIsLoading(false)
        }
    }

    if (status === "loading") {
        return <div className="flex h-screen items-center justify-center bg-black"><Loader2 className="animate-spin text-purple-500" /></div>
    }

    const progress = (currentStep / STEPS.length) * 100

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black p-4 md:p-8">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Command className="size-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Setup your Workspace</h2>
                                <p className="text-xs text-white/40">Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-white/40 hover:text-white" onClick={handleSkip}>
                            Skip for now
                        </Button>
                    </div>
                    <Progress value={progress} className="h-1 bg-white/5" />
                </div>

                <Card className="border-white/10 bg-neutral-900 text-white shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl">{STEPS[currentStep - 1].title}</CardTitle>
                        <CardDescription className="text-white/40">{STEPS[currentStep - 1].description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Brand/Company (Optional)</Label>
                                    <Input
                                        value={formData.brandName}
                                        onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="Acme Inc."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Profile Type</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {["Personal", "Business", "Creator"].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, profileType: type })}
                                                className={cn(
                                                    "relative p-3 rounded-xl border transition-all flex flex-col items-center gap-2 overflow-hidden group",
                                                    formData.profileType === type
                                                        ? "border-purple-500 bg-purple-500/20 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                                                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    formData.profileType === type ? "bg-purple-500/20" : "bg-white/5 group-hover:bg-white/10"
                                                )}>
                                                    {type === "Personal" && <User className="size-5" />}
                                                    {type === "Business" && <Building2 className="size-5" />}
                                                    {type === "Creator" && <Sparkles className="size-5" />}
                                                </div>
                                                <span className="text-xs font-bold uppercase tracking-wider">{type}</span>
                                                {formData.profileType === type && (
                                                    <div className="absolute top-1 right-1 size-3 rounded-full bg-purple-500 flex items-center justify-center">
                                                        <Check className="size-2 text-white" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label>Who is your target audience?</Label>
                                    <Input
                                        value={formData.audienceType}
                                        onChange={e => setFormData({ ...formData, audienceType: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="Tech Entrepreneurs, Creatives, etc."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Industry / Niche</Label>
                                    <Input
                                        value={formData.industryNiche}
                                        onChange={e => setFormData({ ...formData, industryNiche: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="SaaS, E-commerce, Marketing..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Main Content Goals</Label>
                                    <Input
                                        value={formData.contentGoals}
                                        onChange={e => setFormData({ ...formData, contentGoals: e.target.value })}
                                        className="bg-white/5 border-white/10"
                                        placeholder="Brand awareness, Lead gen, Authority..."
                                    />
                                </div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {PLATFORMS.map(platform => (
                                    <button
                                        key={platform.id}
                                        onClick={() => {
                                            const updated = formData.preferredPlatforms.includes(platform.id)
                                                ? formData.preferredPlatforms.filter(id => id !== platform.id)
                                                : [...formData.preferredPlatforms, platform.id]
                                            setFormData({ ...formData, preferredPlatforms: updated })
                                        }}
                                        className={cn(
                                            "relative p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-3 h-28 text-center",
                                            formData.preferredPlatforms.includes(platform.id)
                                                ? "border-blue-500 bg-blue-500/10 text-white"
                                                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                                        )}
                                    >
                                        <platform.icon className="size-6" />
                                        <span className="text-xs font-semibold">{platform.label}</span>
                                        {formData.preferredPlatforms.includes(platform.id) && (
                                            <div className="absolute top-2 right-2 size-4 rounded-full bg-blue-500 flex items-center justify-center">
                                                <Check className="size-2 text-white" strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="grid grid-cols-2 gap-3">
                                {CONTENT_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => {
                                            const updated = formData.preferredContentTypes.includes(type.id)
                                                ? formData.preferredContentTypes.filter(id => id !== type.id)
                                                : [...formData.preferredContentTypes, type.id]
                                            setFormData({ ...formData, preferredContentTypes: updated })
                                        }}
                                        className={cn(
                                            "relative p-4 rounded-xl border transition-all flex items-center gap-3 text-left",
                                            formData.preferredContentTypes.includes(type.id)
                                                ? "border-purple-500 bg-purple-500/10 text-white"
                                                : "border-white/10 bg-white/5 text-white/60 hover:text-white"
                                        )}
                                    >
                                        <div className={cn(
                                            "size-8 rounded-lg flex items-center justify-center",
                                            formData.preferredContentTypes.includes(type.id) ? "bg-purple-500/20" : "bg-white/5"
                                        )}>
                                            <type.icon className="size-4" />
                                        </div>
                                        <span className="text-sm font-medium">{type.label}</span>
                                        {formData.preferredContentTypes.includes(type.id) && (
                                            <div className="ml-auto size-4 rounded-full bg-purple-500 flex items-center justify-center">
                                                <Check className="size-2 text-white" strokeWidth={4} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div className="grid gap-3">
                                    <Label>Best time for your posts</Label>
                                    <div className="flex gap-2">
                                        {["Morning", "Afternoon", "Evening"].map(time => (
                                            <Button
                                                key={time}
                                                variant="outline"
                                                onClick={() => setFormData({ ...formData, preferredPostingTimes: time })}
                                                className={cn(
                                                    "flex-1 border-white/10 bg-white/5",
                                                    formData.preferredPostingTimes === time && "border-purple-500 bg-purple-500/10"
                                                )}
                                            >
                                                <Clock className="size-4 mr-2" />
                                                {time}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label>Posting Frequency</Label>
                                    <div className="flex gap-2">
                                        {["Daily", "3x Weekly", "Weekly"].map(freq => (
                                            <Button
                                                key={freq}
                                                variant="outline"
                                                onClick={() => setFormData({ ...formData, postingFrequency: freq })}
                                                className={cn(
                                                    "flex-1 border-white/10 bg-white/5",
                                                    formData.postingFrequency === freq && "border-blue-500 bg-blue-500/10"
                                                )}
                                            >
                                                <Zap className="size-4 mr-2" />
                                                {freq}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3">
                                    <Label>Automation Level</Label>
                                    <div className="flex gap-2">
                                        {["Manual", "Semi-Auto", "Full Auto"].map(level => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, automationLevel: level })}
                                                className={cn(
                                                    "relative flex-1 p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-2",
                                                    formData.automationLevel === level
                                                        ? "border-emerald-500 bg-emerald-500/20 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                                                        : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                                                )}
                                            >
                                                <ShieldCheck className={cn("size-5", formData.automationLevel === level ? "text-emerald-400" : "text-white/20")} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{level}</span>
                                                {formData.automationLevel === level && (
                                                    <div className="absolute top-2 right-2 size-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                                        <Check className="size-2 text-white" strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-2 p-3 rounded-lg bg-white/5 border border-white/5">
                                        {formData.automationLevel === "Manual" && (
                                            <p className="text-[10px] text-white/60 italic">
                                                Note: You will need to handle all posting actions yourself. Socialyncara will not take any automated actions.
                                            </p>
                                        )}
                                        {formData.automationLevel === "Semi-Auto" && (
                                            <p className="text-[10px] text-white/60 italic">
                                                Note: AI will prepare posts, but you must manually approve them before the preferred time, or they will be delayed.
                                            </p>
                                        )}
                                        {formData.automationLevel === "Full Auto" && (
                                            <p className="text-[10px] text-white/60 italic">
                                                Note: Posts will be generated and published automatically at your preferred time. No manual intervention needed.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                        <Button
                            variant="outline"
                            className="border-white/10 bg-white/5"
                            onClick={prevStep}
                            disabled={currentStep === 1 || isLoading}
                        >
                            <ChevronLeft className="size-4 mr-2" /> Back
                        </Button>
                        <Button
                            className="bg-white text-black hover:bg-neutral-200"
                            onClick={currentStep === STEPS.length ? handleFinish : nextStep}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                            {currentStep === STEPS.length ? "Finish Setup" : "Continue"}
                            {!isLoading && currentStep !== STEPS.length && <ChevronRight className="size-4 ml-2" />}
                        </Button>
                    </CardFooter>
                </Card>
                <p className="text-center text-[10px] text-white/20 uppercase tracking-widest font-black">Powered by Socialyncara Intelligence Layer</p>
            </div>
        </div >
    )
}
