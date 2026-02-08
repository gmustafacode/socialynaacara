"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
    const router = useRouter()
    const { data: session } = useSession()
    const user = session?.user as { name?: string; email?: string; image?: string; id?: string } | undefined
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userData, setUserData] = useState<any>(null)

    useEffect(() => {
        if (user?.id) {
            fetchUserData()
        }
    }, [user?.id])

    const fetchUserData = async () => {
        try {
            const res = await fetch(`/api/users/${user?.id}`)
            if (res.ok) {
                const data = await res.json()
                setUserData(data)
            }
        } catch (error) {
            console.error("Failed to fetch user data")
        } finally {
            setLoading(false)
        }
    }

    const handleUpdatePreferences = async (prefs: any) => {
        setSaving(true)
        try {
            const res = await fetch(`/api/users/${user?.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ preferences: prefs })
            })
            if (res.ok) {
                toast.success("Preferences updated successfully.")
                const data = await res.json()
                setUserData(data)
            } else {
                toast.error("Failed to update preferences.")
            }
        } catch (error) {
            toast.error("An error occurred.")
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to PERMANENTLY delete your account? This will wipe ALL your data including connected accounts, posts, and history. This cannot be undone.")) {
            return
        }

        try {
            const res = await fetch('/api/user/delete', { method: 'DELETE' })
            if (res.ok) {
                toast.success("Account deleted successfully.")
                await signOut({ callbackUrl: "/login" })
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to delete account.")
            }
        } catch (error) {
            toast.error("An error occurred while deleting your account.")
        }
    }

    if (loading) {
        return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-purple-500" /></div>
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-white/60">Manage your account preferences and workspace settings.</p>
            </div>

            <div className="grid gap-6">
                <Card className="border-white/10 bg-neutral-900 text-white">
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription className="text-white/40">Your account details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Display Name</Label>
                            <Input
                                className="bg-white/5 border-white/10"
                                defaultValue={userData?.name || ""}
                                readOnly={true}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email Address</Label>
                            <Input
                                className="bg-white/5 border-white/10"
                                defaultValue={userData?.email || ""}
                                readOnly={true}
                            />
                        </div>
                        <p className="text-[10px] text-white/20 italic">
                            Profile editing is managed through your primary identity provider.
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-neutral-900 text-white shadow-xl shadow-purple-500/5">
                    <CardHeader>
                        <CardTitle>Automation Preferences</CardTitle>
                        <CardDescription className="text-white/40">Configure how the AI agent handles your content.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-base">Email Notifications</Label>
                                <p className="text-xs text-white/40">Get notified when a post is successfully published or fails.</p>
                            </div>
                            <input
                                type="checkbox"
                                className="size-5 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500"
                                checked={userData?.preferences?.notificationsEnabled ?? true}
                                onChange={(e) => handleUpdatePreferences({ ...userData?.preferences, notificationsEnabled: e.target.checked })}
                                disabled={saving}
                            />
                        </div>

                        <div className="grid gap-3">
                            <Label>Preferred Content Types</Label>
                            <Input
                                placeholder="AI, Fintech, Open Source..."
                                className="bg-white/5 border-white/10"
                                defaultValue={userData?.preferences?.preferredContentTypes || ""}
                                onBlur={(e) => handleUpdatePreferences({ ...userData?.preferences, preferredContentTypes: e.target.value })}
                                disabled={saving}
                            />
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-black">Used for auto-ingestion targeting</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/10 bg-neutral-900 text-white shadow-xl">
                    <CardHeader>
                        <CardTitle>Developer & Webhooks</CardTitle>
                        <CardDescription className="text-white/40">Integrate Socialyncara with external tools like n8n.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-xs uppercase tracking-[0.2em] text-white/40">Incoming Content Webhook</Label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    value={`${window.location.origin}/api/n8n/publish`}
                                    className="bg-white/5 border-white/10 font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    className="border-white/10"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/api/n8n/publish`)
                                        toast.success("URL copied!")
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Label className="text-xs uppercase tracking-[0.2em] text-white/40">API Secret Key (X-API-KEY)</Label>
                            <div className="flex gap-2">
                                <Input
                                    readOnly
                                    type="password"
                                    value="••••••••••••••••"
                                    className="bg-white/5 border-white/10 font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    className="border-white/10"
                                    onClick={() => toast.info("Check your .env file for the N8N_API_KEY value.")}
                                >
                                    Verify
                                </Button>
                            </div>
                            <p className="text-[10px] text-white/20">Use this key in the header of your n8n 'HTTP Request' node.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-red-500/20 bg-red-500/5 text-white">
                    <CardHeader>
                        <CardTitle className="text-red-500">Danger Zone</CardTitle>
                        <CardDescription className="text-white/40">
                            Permanently delete your account and all associated data. This action is irreversible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            className="bg-red-600 hover:bg-red-700 font-bold"
                        >
                            Delete Account
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
