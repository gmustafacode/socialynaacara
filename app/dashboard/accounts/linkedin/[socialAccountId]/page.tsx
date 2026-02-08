
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Youtube, Calendar, Send, Save, Loader2, Globe, Users, Info, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"

export default function LinkedInArticlePostPage() {
    const params = useParams()
    const router = useRouter()
    const socialAccountId = params.socialAccountId as string

    const [account, setAccount] = useState<any>(null)
    const [loadingAccount, setLoadingAccount] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Form State (ARTICLE Logic)
    const [youtubeUrl, setYoutubeUrl] = useState("")
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [groupIds, setGroupIds] = useState("")
    const [visibility, setVisibility] = useState("PUBLIC")
    const [targetType, setTargetType] = useState("FEED") // FEED, GROUP, BOTH
    const [scheduleDate, setScheduleDate] = useState("")

    // Preview
    const [thumbnailUrl, setThumbnailUrl] = useState("")

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const res = await fetch("/api/accounts")
                if (res.ok) {
                    const data = await res.json()
                    const acc = data.find((a: any) => a.id === socialAccountId)
                    if (acc) setAccount(acc)
                    else toast.error("Account not found")
                }
            } catch (error) {
                console.error("Failed to load account", error)
            } finally {
                setLoadingAccount(false)
            }
        }
        if (socialAccountId) fetchAccount()
    }, [socialAccountId])

    // Auto-generate Thumbnail
    useEffect(() => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = youtubeUrl.match(regExp);
        if (match && match[2].length === 11) {
            setThumbnailUrl(`https://i.ytimg.com/vi/${match[2]}/maxresdefault.jpg`);
        } else {
            setThumbnailUrl("");
        }
    }, [youtubeUrl]);

    const handleSubmit = async (action: "DRAFT" | "SCHEDULE" | "PUBLISH") => {
        if (!youtubeUrl || !title || !description) {
            toast.error("Please fill in all required fields (YouTube URL, Title, Description)")
            return
        }
        if (targetType === "GROUP" && !groupIds) {
            toast.error("Please provide at least one Group ID")
            return
        }
        if (action === "SCHEDULE" && !scheduleDate) {
            toast.error("Please select a date and time to schedule")
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                socialAccountId,
                youtubeUrl,
                title,
                description,
                targetType,
                groupIds: groupIds ? groupIds.split(',').map(g => g.trim()) : [],
                visibility,
                publishNow: action === "PUBLISH",
                scheduledAt: action === "SCHEDULE" ? new Date(scheduleDate).toISOString() : null,
            }

            const res = await fetch("/api/linkedin/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to create post")
            }

            toast.success(
                action === "PUBLISH" ? "Post queued for publishing!" :
                    action === "SCHEDULE" ? "Post scheduled successfully!" :
                        "Draft saved successfully!"
            )

            router.push("/dashboard/queue")

        } catch (error: any) {
            toast.error(error.message || "Something went wrong")
        } finally {
            setSubmitting(false)
        }
    }

    if (loadingAccount) return <div className="p-8 text-white">Loading account details...</div>
    if (!account) return <div className="p-8 text-white">Account not found. <Link href="/dashboard/accounts" className="underline">Go back</Link></div>

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/accounts">
                        <Button variant="ghost" className="text-white/60 hover:text-white">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">LinkedIn UGC Article</h1>
                        <p className="text-white/60 flex items-center gap-2">
                            Connected as <span className="text-white font-medium">{account.metadata?.username || "LinkedIn User"}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full text-blue-400 text-sm">
                    <Globe className="h-4 w-4" /> Production Mode
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area (Form) */}
                <div className="lg:col-span-7 space-y-6">
                    <Card className="bg-neutral-900/50 border-white/10 backdrop-blur-xl">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                                <Youtube className="h-5 w-5 text-red-500" /> Content Source
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label className="text-white font-medium">YouTube URL</Label>
                                <Input
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                    className="bg-black/40 border-white/10 text-white h-12 focus:ring-purple-500/50"
                                />
                                <p className="text-[10px] text-white/40">Enter a valid YouTube URL to extract the originalUrl and thumbnail.</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white font-medium">Post Title (Article Title)</Label>
                                <Input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter reaching title..."
                                    className="bg-black/40 border-white/10 text-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-white font-medium">Description (Share Commentary)</Label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What do you want to say about this video?"
                                    className="w-full min-h-[120px] bg-black/40 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 resize-y transition-all"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900/50 border-white/10 backdrop-blur-xl">
                        <CardHeader className="border-b border-white/5">
                            <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-purple-500" /> Distribution Targets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Post To</Label>
                                    <Select value={targetType} onValueChange={setTargetType}>
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                            <SelectItem value="FEED">Personal Feed Only</SelectItem>
                                            <SelectItem value="GROUP">LinkedIn Groups Only</SelectItem>
                                            <SelectItem value="BOTH">Feed + Groups</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-white font-medium">Feed Visibility</Label>
                                    <Select value={visibility} onValueChange={setVisibility} disabled={targetType === 'GROUP'}>
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                            <SelectItem value="PUBLIC">Everyone (Public)</SelectItem>
                                            <SelectItem value="CONNECTIONS">Connections Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {(targetType === 'GROUP' || targetType === 'BOTH') && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-white font-medium flex items-center gap-2">
                                        LinkedIn Group IDs
                                        <Info className="h-3 w-3 text-white/40 cursor-help" />
                                    </Label>
                                    <Input
                                        value={groupIds}
                                        onChange={(e) => setGroupIds(e.target.value)}
                                        placeholder="12345, 67890..."
                                        className="bg-black/40 border-white/10 text-white"
                                    />
                                    <p className="text-[10px] text-white/40">Enter URN numbers (comma separated) for the target groups.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar (Preview & Actions) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Real-time Preview */}
                    <Card className="bg-neutral-900 border-white/10 overflow-hidden">
                        <CardHeader className="p-4 border-b border-white/5">
                            <CardTitle className="text-sm font-medium text-white/60">LIVE PREVIEW</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 bg-black/20 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                        {account.metadata?.username?.[0] || 'L'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{account.metadata?.username || "LinkedIn User"}</p>
                                        <p className="text-[10px] text-white/40 flex items-center gap-1">
                                            {targetType === 'GROUP' ? 'Container Visibility' : `${visibility.toLowerCase()} • Just now`}
                                            <Globe className="h-2 w-2" />
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-white/90 line-clamp-3">
                                    {description || "Your share commentary will appear here..."}
                                </p>
                            </div>

                            <div className="border-t border-white/10">
                                {thumbnailUrl ? (
                                    <div className="relative aspect-video">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={thumbnailUrl} alt="YouTube Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <Youtube className="h-12 w-12 text-red-600 shadow-xl" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="aspect-video bg-black/40 flex flex-col items-center justify-center text-white/20 gap-2">
                                        <Youtube className="h-12 w-12" />
                                        <span className="text-xs">Waiting for YouTube URL...</span>
                                    </div>
                                )}
                                <div className="p-4 space-y-1">
                                    <h4 className="text-sm font-semibold text-white uppercase tracking-tight line-clamp-1">
                                        {title || "ARTICLE TITLE"}
                                    </h4>
                                    <p className="text-xs text-white/40 flex items-center gap-1">
                                        YOUTUBE.COM <ExternalLink className="h-2 w-2" />
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-neutral-900 border-white/10 p-5 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase text-white/40 font-bold tracking-wider">Schedule Execution</Label>
                            <Input
                                type="datetime-local"
                                className="bg-black/20 border-white/10 text-white [color-scheme:dark]"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={() => handleSubmit("PUBLISH")}
                                className="w-full h-12 bg-white text-black hover:bg-white/90 font-bold text-md"
                                disabled={submitting || !!scheduleDate}
                            >
                                {submitting && !scheduleDate ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                                Publish Now
                            </Button>

                            <Button
                                onClick={() => handleSubmit("SCHEDULE")}
                                variant="outline"
                                className="w-full h-12 border-white/10 text-white hover:bg-white/5 font-semibold"
                                disabled={submitting || !scheduleDate}
                            >
                                {submitting && scheduleDate ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Calendar className="h-5 w-5 mr-2" />}
                                Schedule article
                            </Button>

                            <Button
                                onClick={() => handleSubmit("DRAFT")}
                                variant="ghost"
                                className="w-full text-white/60 hover:text-white"
                                disabled={submitting}
                            >
                                <Save className="h-4 w-4 mr-2" />
                                Save as draft
                            </Button>
                        </div>
                    </Card>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-[10px] text-amber-200/60 leading-relaxed">
                        <p className="flex items-center gap-2 font-bold text-amber-500 mb-1">
                            <Info className="h-3 w-3" /> SAAS RELIABILITY NOTE
                        </p>
                        This system uses <strong>Inngest Workers</strong> for job orchestration. Once you click "Publish", the job is offloaded to a distributed execution engine that handles LinkedIn rate limits and retries automatically.
                    </div>
                </div>
            </div>
        </div>
    )
}
