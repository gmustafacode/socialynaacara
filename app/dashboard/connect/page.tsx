"use client"

import { useState, useEffect } from 'react'
import { Check, Loader2, Plus, Share2, AlertTriangle, BookOpen, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from "sonner"
import Link from 'next/link'

// Fallback if components aren't ready yet (should be soon)
// But to be safe, I'm importing them. If this file is compiled before components exist, it might error.
// Codebase is not compiled until dev server runs.

import { LinkedInConnectModal } from '@/components/LinkedInConnectModal'
import { LinkedInCapabilityPanel } from '@/components/linkedin/capability-panel'

export default function ConnectPage() {
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState<string | null>(null)
    const [initialFetch, setInitialFetch] = useState(true)
    const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false)

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts')
            if (res.ok) {
                const data = await res.json()
                setAccounts(data)
            }
        } catch (error) {
            console.error("Failed to fetch accounts:", error)
        } finally {
            setInitialFetch(false)
        }
    }

    useEffect(() => {
        fetchAccounts()
    }, [])

    // Platforms Config
    const platforms = [
        { id: 'google', name: 'Google / YouTube', color: 'bg-red-600', textColor: 'text-red-500', description: 'Post videos and manage channel' },
        { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700', textColor: 'text-blue-500', description: 'Share updates and articles' },
        { id: 'twitter', name: 'X / Twitter', color: 'bg-black', textColor: 'text-white', description: 'Tweet and engage in real-time' },
        { id: 'instagram', name: 'Instagram', color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', textColor: 'text-pink-500', description: 'Share photos and reels' },
        { id: 'whatsapp', name: 'WhatsApp', color: 'bg-green-600', textColor: 'text-green-500', description: 'Direct messaging and status' },
        { id: 'tiktok', name: 'TikTok', color: 'bg-black', textColor: 'text-white', description: 'Post viral short videos' },
        { id: 'reddit', name: 'Reddit', color: 'bg-orange-600', textColor: 'text-orange-500', description: 'Community engagement' },
        { id: 'medium', name: 'Medium', color: 'bg-black', textColor: 'text-white', description: 'Publish long-form articles' },
    ]

    const [disconnecting, setDisconnecting] = useState<string | null>(null)

    const handleConnect = async (platformId: string) => {
        if (platformId === 'linkedin') {
            setIsLinkedInModalOpen(true)
            return
        }
        setLoading(platformId)
        try {
            const response = await fetch(`/api/oauth/init/${platformId}`, {
                method: 'POST',
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || "Failed to initiate OAuth")
            }

            const { url } = await response.json()
            window.location.href = url
        } catch (error: any) {
            console.error("Connection error:", error)
            toast.error(error.message || "Failed to initiate connection.")
            setLoading(null)
        }
    }

    const handleDisconnect = async (accountId: string, platformName: string) => {
        if (!confirm(`Are you sure you want to disconnect ${platformName}? All pending posts will be cancelled.`)) return

        setDisconnecting(accountId)
        try {
            const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' })
            if (res.ok) {
                toast.success(`Disconnected from ${platformName}`)
                setAccounts(prev => prev.filter(a => a.id !== accountId))
            } else {
                throw new Error("Failed to disconnect")
            }
        } catch (error) {
            toast.error("Error disconnecting account")
        } finally {
            setDisconnecting(null)
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <LinkedInConnectModal
                isOpen={isLinkedInModalOpen}
                onClose={() => setIsLinkedInModalOpen(false)}
            />
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Connect Accounts</h2>
                <p className="text-white/60">Manage your social media connections and permissions.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {platforms.map(p => (
                    <div
                        key={p.id}
                        className="group relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900 p-6 transition-all hover:border-purple-500/50"
                    >
                        <div className={`absolute top-0 right-0 p-24 rounded-full ${p.color} blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none`} />

                        <div className="relative flex flex-col justify-between h-40">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg text-white">{p.name}</h3>
                                        {p.id === 'linkedin' && (
                                            <Link href="/linkedin-documentation">

                                                <div
                                                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 text-yellow-500 transition-all group/docs inline-flex items-center gap-2 cursor-pointer"
                                                    title="View Documentation"
                                                >
                                                    <span className='text-sm'>Open Docs</span>
                                                    <BookOpen className="size-3.5 text-blue-400 group-hover/docs:text-blue-300" />
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                    <p className="text-xs text-white/40">OAuth 2.0 Secure</p>
                                    <p className="text-[10px] text-white/20 mt-1">{p.description}</p>
                                </div>
                                <Share2 className={`size-6 ${p.textColor} opacity-80`} />
                            </div>

                            <div className="mt-4 space-y-3 overflow-y-auto max-h-40 pr-2 custom-scrollbar">
                                {initialFetch ? (
                                    <div className="space-y-2">
                                        <div className="h-4 bg-white/5 animate-pulse rounded w-1/2" />
                                        <div className="h-10 bg-white/5 animate-pulse rounded" />
                                    </div>
                                ) : accounts.filter(a => a.platform === p.id).length > 0 ? (
                                    accounts.filter(a => a.platform === p.id).map(account => (
                                        <div key={account.id} className="space-y-2 border-t border-white/5 pt-2 first:border-0 first:pt-0">
                                            <div className="flex flex-col gap-1 text-[10px] font-medium">
                                                {account.status === 'revoked' || account.status === 'expired' ? (
                                                    <div className="flex items-center gap-2 text-red-400">
                                                        <AlertTriangle className="size-2.5" />
                                                        Reconnect Required
                                                    </div>
                                                ) : account.status === 'setup' ? (
                                                    <div className="flex items-center gap-2 text-yellow-500">
                                                        <Loader2 className="size-2.5 animate-spin" />
                                                        Completing Setup...
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-green-500">
                                                        <Check className="size-2.5" />
                                                        {account.metadata?.name || account.metadata?.username || 'Connected'}
                                                        {account.platform === 'linkedin' ? (
                                                            account.metadata?.username && (
                                                                <span className="text-white/40 ml-1 font-normal">({account.metadata.username})</span>
                                                            )
                                                        ) : (
                                                            account.platformAccountId && (
                                                                <span className="text-white/40 ml-1 font-normal">({account.platformAccountId.substring(0, 8)})</span>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDisconnect(account.id, p.name)}
                                                disabled={disconnecting === account.id}
                                                className="w-full py-1.5 rounded-md bg-red-500/5 text-red-500/80 border border-red-500/10 text-[10px] font-semibold hover:bg-red-500/10 transition-all disabled:opacity-50"
                                            >
                                                {disconnecting === account.id ? <Loader2 className="size-3 animate-spin mx-auto" /> : 'Disconnect'}
                                            </button>
                                        </div>
                                    ))
                                ) : null}

                                {(!initialFetch && accounts.filter(a => a.platform === p.id).length === 0) && (
                                    <button
                                        onClick={() => handleConnect(p.id)}
                                        disabled={loading === p.id}
                                        className="w-full py-3 rounded-lg bg-white text-black hover:bg-neutral-200 text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-white/5 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                                    >
                                        {loading === p.id ? <Loader2 className="size-4 animate-spin" /> : null}
                                        {loading === p.id ? 'Connecting...' : 'Connect Account'}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* Capability Panel for LinkedIn */}
            {accounts.find(a => a.platform === 'linkedin' && a.status !== 'revoked' && a.status !== 'setup') && (
                <div className="mt-12 bg-neutral-900 border border-white/10 rounded-xl p-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="size-12 rounded-full bg-blue-700 flex items-center justify-center">
                            <span className="font-bold text-white text-lg">in</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">LinkedIn Configuration</h2>
                            <p className="text-white/60">Manage your connected LinkedIn identity and features.</p>
                        </div>
                        <Link href="/dashboard/linkedin/control-panel" className="ml-auto">
                            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                                Open Full Control Panel
                                <ExternalLink className="size-4 ml-2" />
                            </Button>
                        </Link>
                    </div>

                    <LinkedInCapabilityPanel
                        accountId={accounts.find(a => a.platform === 'linkedin')!.id}
                        isEnterprise={accounts.find(a => a.platform === 'linkedin')!.isEnterprise}
                        capabilities={accounts.find(a => a.platform === 'linkedin')!.capabilities || {}}
                        lastVerified={accounts.find(a => a.platform === 'linkedin')!.lastVerifiedAt}
                        onVerifyComplete={(newCaps, newMeta) => {
                            setAccounts(prev => prev.map(a =>
                                a.platform === 'linkedin'
                                    ? {
                                        ...a,
                                        capabilities: newCaps,
                                        metadata: newMeta || a.metadata,
                                        lastVerifiedAt: new Date().toISOString()
                                    }
                                    : a
                            ))
                        }}
                    />
                </div>
            )}
        </div>
    )
}
