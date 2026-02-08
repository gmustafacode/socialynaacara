
"use client"

import React, { useState, useEffect } from 'react'
import {
    Shield,
    RefreshCw,
    Trash2,
    ExternalLink,
    AlertTriangle,
    CheckCircle,
    Lock,
    Check,
    AlertCircle,
    ArrowLeft,
    Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { LinkedInCapabilityPanel } from '@/components/linkedin/capability-panel'
import { useRouter } from 'next/navigation'

interface LinkedInStatus {
    connected: boolean;
    id?: string;
    status?: string;
    lastVerifiedAt?: string;
    isEnterprise?: boolean;
    capabilities?: Record<string, boolean>;
    metadata?: {
        name: string;
        image: string | null;
        profileUrl: string;
    };
}

export default function LinkedInControlPanelPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<LinkedInStatus | null>(null)
    const [disconnecting, setDisconnecting] = useState(false)

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/oauth/linkedin/status')
            if (res.ok) {
                const statusData = await res.json()
                setData(statusData)
            }
        } catch (error) {
            console.error("Failed to fetch LinkedIn status", error)
        } finally {
            setLoading(false)
        }
    }

    // Initial fetch + Polling every 10 seconds for real-time updates
    useEffect(() => {
        fetchStatus()
        const interval = setInterval(fetchStatus, 10000)
        return () => clearInterval(interval)
    }, [])

    const handleDisconnect = async () => {
        if (!data?.id) return
        if (!confirm("Are you sure you want to disconnect LinkedIn? This will revoke all access tokens.")) return

        setDisconnecting(true)
        try {
            const res = await fetch(`/api/accounts/${data.id}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success("LinkedIn disconnected successfully")
                router.push('/dashboard/connect')
            } else {
                throw new Error("Failed to disconnect")
            }
        } catch (error) {
            toast.error("Error disconnecting account")
        } finally {
            setDisconnecting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <RefreshCw className="size-8 animate-spin text-white/20" />
            </div>
        )
    }

    if (!data?.connected) {
        return (
            <div className="container mx-auto max-w-4xl py-12 px-6">
                <Card className="bg-neutral-900 border-white/10">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                        <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                            <Shield className="size-8 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">No Linked Account Found</h2>
                        <p className="text-white/60 max-w-md">
                            You need to connect your LinkedIn account before you can access the Control Panel.
                        </p>
                        <Link href="/dashboard/connect">
                            <Button className="mt-4 h-12 px-8 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                Connect LinkedIn
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6 md:p-12">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Navigation & Breadcrumbs */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-white/40">
                        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                        <span>/</span>
                        <Link href="/dashboard/connect" className="hover:text-white transition-colors">Connect</Link>
                        <span>/</span>
                        <span className="text-white">LinkedIn Control Panel</span>
                    </div>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between pb-8 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                            <span className="size-10 rounded-lg bg-[#0077b5] flex items-center justify-center text-lg font-bold">in</span>
                            LinkedIn Control Panel
                        </h1>
                        <p className="text-white/60 mt-2 max-w-2xl">
                            Real-time capability monitoring and access control. Feature availability is verified directly via LinkedIn APIs.
                        </p>
                    </div>
                    <div>
                        {data.status === 'active' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 font-medium text-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                System Operational
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 font-medium text-sm">
                                <AlertTriangle className="size-3" />
                                {data.status === 'revoked' ? 'Access Revoked' : 'Restricted Mode'}
                            </div>
                        )}
                        <Link href="/dashboard/linkedin/post">
                            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-blue-600/20">
                                <Share2 className="size-4 mr-2" />
                                Create New Post
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Account Identity Card */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="bg-neutral-900 border-white/10 col-span-1 h-fit">
                        <CardHeader>
                            <CardTitle className="text-lg text-white">Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center text-center p-4 bg-white/5 rounded-xl border border-white/5">
                                {data.metadata?.image ? (
                                    <img
                                        src={data.metadata.image}
                                        alt={data.metadata.name}
                                        className="size-20 rounded-full border-2 border-white/10 shadow-xl mb-3"
                                    />
                                ) : (
                                    <div className="size-20 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white mb-3">
                                        {data.metadata?.name?.[0] || 'U'}
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-xl text-white">{data.metadata?.name}</h3>
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Identity Synced" />
                                </div>
                                <a
                                    href={data.metadata?.profileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-1"
                                >
                                    View Profile <ExternalLink className="size-3" />
                                </a>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-white/40">Status</span>
                                    <span className={`font-mono ${data.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                        {data.status?.toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-white/40">Last Verified</span>
                                    <span className="text-white/70 text-xs">
                                        {data.lastVerifiedAt ? new Date(data.lastVerifiedAt).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm py-2 border-b border-white/5">
                                    <span className="text-white/40">Plan Inference</span>
                                    <span className="text-purple-400 text-xs flex items-center gap-1">
                                        <Lock className="size-3" /> Strict Privacy
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50"
                                onClick={handleDisconnect}
                                disabled={disconnecting}
                            >
                                <Trash2 className="size-4 mr-2" />
                                {disconnecting ? 'Disconnecting...' : 'Disconnect Account'}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Capability Matrix - Reusing the compliant component */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-neutral-900 border-white/10 overflow-hidden">
                            <div className="absolute top-0 right-0 p-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                            <CardContent className="p-8">
                                <LinkedInCapabilityPanel
                                    accountId={data.id!}
                                    isEnterprise={data.isEnterprise}
                                    capabilities={data.capabilities || {}}
                                    lastVerified={data.lastVerifiedAt!}
                                    onVerifyComplete={(newCaps, newMeta) => {
                                        // Update local state immediately upon verification
                                        setData(prev => prev ? ({
                                            ...prev,
                                            capabilities: newCaps,
                                            metadata: newMeta ? {
                                                name: newMeta.name,
                                                image: newMeta.picture || newMeta.profilePicture || newMeta.image,
                                                profileUrl: `https://www.linkedin.com/in/${newMeta.id || ''}`
                                            } : prev.metadata,
                                            lastVerifiedAt: new Date().toISOString(),
                                            status: newCaps.basic_posting ? 'active' : 'restricted'
                                        }) : null)
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Additional status info section */}
                        {data.status === 'restricted' && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                                <AlertTriangle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-red-400 font-bold text-sm">Account Restricted</h4>
                                    <p className="text-white/70 text-sm mt-1">
                                        Your account is restricted because it failed the latest basic capability check (posting permissions).
                                        Please re-authenticate or check your LinkedIn settings.
                                    </p>
                                    <Link href="/linkedin-documentation#errors">
                                        <Button size="sm" variant="link" className="px-0 text-red-300 h-auto mt-2 text-xs">
                                            Troubleshoot Issue &rarr;
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-white/80 font-medium">
                                    <Shield className="size-4 text-green-400" />
                                    <span>Token Security</span>
                                </div>
                                <p className="text-xs text-white/40">
                                    Access tokens are encrypted at rest using AES-256-CBC. No raw tokens are ever exposed to the client.
                                </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex items-center gap-2 mb-2 text-white/80 font-medium">
                                    <RefreshCw className="size-4 text-blue-400" />
                                    <span>Auto-Refresh</span>
                                </div>
                                <p className="text-xs text-white/40">
                                    Tokens are automatically refreshed 5 minutes before expiration. Session continuity is maintained.
                                </p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
