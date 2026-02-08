
"use client"

import React, { useState, useEffect } from 'react'
import { Check, Info, Loader2, Shield, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

// Using relative imports to fix resolution issues
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'

interface LinkedInConnectModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LinkedInConnectModal({ isOpen, onClose }: LinkedInConnectModalProps) {
    const [loading, setLoading] = useState(false)
    const [acknowledged, setAcknowledged] = useState(false)
    const [formData, setFormData] = useState({
        clientId: '',
        clientSecret: '',
        accessToken: '',
        refreshToken: '',
        redirectUri: '',
        scopes: ['openid', 'profile', 'email', 'w_member_social']
    })

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setFormData(prev => ({
                ...prev,
                redirectUri: `${window.location.host.includes('localhost') ? 'http' : 'https'}://${window.location.host}/api/oauth/callback`
            }))
        }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!acknowledged) {
            toast.error("Please acknowledge the instructions first.")
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/oauth/linkedin/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to initiate LinkedIn OAuth")

            if (data.direct) {
                toast.success("LinkedIn Enterprise connection verified successfully!")
                onClose()
                window.location.reload()
            } else {
                window.location.href = data.url
            }
        } catch (error: any) {
            toast.error(error.message)
            setLoading(false)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-[#0A0A0A] border-white/10 text-white overflow-y-auto max-h-[95vh] p-0 gap-0">
                <div className="p-8 space-y-8">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30">
                                <Shield className="size-6 text-blue-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-bold tracking-tight">LinkedIn Enterprise Connect</DialogTitle>
                                <DialogDescription className="text-white/40 text-base mt-1">
                                    Power your automation with a dedicated LinkedIn Application.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Instructions Sidebar */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-2xl bg-blue-500/5 border border-blue-500/10 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="flex items-center gap-2 font-bold text-blue-400 text-sm italic uppercase tracking-wider">
                                        Configuration Guide
                                    </h4>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { step: 1, text: "Create App in Developer Portal" },
                                        { step: 2, text: "Enable 'Share on LinkedIn' & 'Sign In' products" },
                                        { step: 3, text: "Authorize Redirect URI in Auth settings" },
                                        { step: 4, text: "Generate Access Token via Token Generator or Handshake" },
                                    ].map((s) => (
                                        <div key={s.step} className="flex gap-3">
                                            <span className="flex-shrink-0 size-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold flex items-center justify-center border border-blue-500/30">
                                                {s.step}
                                            </span>
                                            <p className="text-xs text-white/70 leading-relaxed font-medium">{s.text}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2">
                                    <Link href="/linkedin-documentation" target="_blank">
                                        <Button variant="outline" size="sm" className="w-full bg-transparent border-blue-500/20 text-blue-400 hover:bg-blue-500/10 h-8 text-[11px] font-bold">
                                            VIEW ARCHITECTURE & SETUP
                                            <ExternalLink className="size-3 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-yellow-500/5 border border-yellow-500/10 p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="size-4 text-yellow-500" />
                                    <h5 className="text-[11px] font-bold text-yellow-500 uppercase tracking-widest">Platform Integrity</h5>
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed">
                                    LinkedIn enforces strict rate limits. Manual Token mode skips the handshake but requires valid credentials for refresh cycles. Ensure your Redirect URI is exact.
                                </p>
                            </div>
                        </div>

                        {/* Form Area */}
                        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
                            <div className="space-y-4">
                                <div className="grid gap-2 group">
                                    <Label htmlFor="clientId" className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Client ID</Label>
                                    <Input
                                        id="clientId"
                                        placeholder="Enter your LinkedIn Client ID"
                                        value={formData.clientId}
                                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                        className="bg-white/5 border-white/5 focus:border-blue-500/50 focus:ring-0 transition-all h-11 text-sm font-medium"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2 group">
                                    <Label htmlFor="clientSecret" className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Client Secret</Label>
                                    <Input
                                        id="clientSecret"
                                        type="password"
                                        placeholder="••••••••••••••••"
                                        value={formData.clientSecret}
                                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                                        className="bg-white/5 border-white/5 focus:border-blue-500/50 focus:ring-0 transition-all h-11 text-sm font-medium"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2 group">
                                    <Label htmlFor="accessToken" className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">OAuth 2.0 Access Token</Label>
                                    <Input
                                        id="accessToken"
                                        type="password"
                                        placeholder="Paste your temporary or permanent token"
                                        value={formData.accessToken}
                                        onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                                        className="bg-white/5 border-white/5 focus:border-blue-500/50 focus:ring-0 transition-all h-11 text-sm font-medium"
                                        required
                                    />
                                </div>

                                <div className="grid gap-2 group">
                                    <Label htmlFor="refreshToken" className="text-xs font-bold text-white/50 uppercase tracking-widest pl-1">Refresh Token (Optional but Recommended)</Label>
                                    <Input
                                        id="refreshToken"
                                        type="password"
                                        placeholder="Paste your refresh token for automatic updates"
                                        value={formData.refreshToken}
                                        onChange={(e) => setFormData({ ...formData, refreshToken: e.target.value })}
                                        className="bg-white/5 border-white/5 focus:border-blue-500/50 focus:ring-0 transition-all h-11 text-sm font-medium"
                                    />
                                    <p className="text-blue-400 text-[10px] font-bold pl-1 uppercase tracking-tighter opacity-80">
                                        {formData.accessToken ? "Direct Verification Mode Enabled" : "Handshake Mode"}
                                    </p>
                                </div>

                                <div className="grid gap-2 opacity-50 hover:opacity-100 transition-opacity">
                                    <Label htmlFor="redirectUri" className="text-[10px] font-bold text-white/30 uppercase tracking-widest pl-1">Authorized Redirect URI</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="redirectUri"
                                            value={formData.redirectUri}
                                            readOnly
                                            className="bg-white/5 border-white/5 h-9 text-[10px] font-mono cursor-default"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 pt-4 px-1">
                                <Checkbox
                                    id="ack"
                                    checked={acknowledged}
                                    onCheckedChange={(checked) => setAcknowledged(!!checked)}
                                    className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label htmlFor="ack" className="text-[11px] text-white/50 font-medium leading-tight">
                                    I confirm that my LinkedIn App has the required permissions and the Redirect URI is configured to match exactly.
                                </label>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="px-8 py-6 bg-white/[0.02] border-t border-white/5 flex items-center justify-end gap-3 rounded-b-3xl">
                    <Button variant="ghost" onClick={onClose} className="text-white/40 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !acknowledged}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 h-12 rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest min-w-[200px]"
                    >
                        {loading ? <Loader2 className="size-5 animate-spin" /> : (formData.accessToken ? "Connect & Verify" : "Initiate Handshake")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

