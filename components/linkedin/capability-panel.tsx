
"use client"

import React, { useState } from 'react'
import { CheckCircle, XCircle, Lock, RefreshCw, AlertTriangle, ExternalLink, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Capability {
    key: string;
    label: string;
    description: string;
    requiredScope?: string;
    explanation?: string;
}

const FEATURE_LIST: Capability[] = [
    {
        key: 'basic_posting',
        label: 'Post to Profile',
        description: 'Create text and link posts on your personal profile.',
        requiredScope: 'w_member_social'
    },
    {
        key: 'image_posting',
        label: 'Upload Images',
        description: 'Attach images to your posts.',
        requiredScope: 'w_member_social'
    },
    {
        key: 'organization_admin',
        label: 'Company Page Access',
        description: 'Manage specific organization pages.',
        explanation: 'Requires you to be an Administrator of at least one LinkedIn Page.',
        requiredScope: 'rw_organization_admin'
    },
    {
        key: 'analytics_read',
        label: 'View Analytics',
        description: 'See engagement metrics for your posts.',
        explanation: 'Available for Company Pages or specific premium APIs.',
        requiredScope: 'r_organization_social' // simplified
    },
    {
        key: 'enterprise_mode',
        label: 'Enterprise Connect',
        description: 'Using dedicated LinkedIn Application credentials.',
        explanation: 'Requires Client ID and Client Secret from LinkedIn Developer Portal.'
    }
]
interface Props {
    accountId: string;
    isEnterprise?: boolean;
    capabilities: Record<string, boolean>;
    lastVerified: string | null;
    onVerifyComplete?: (newCapabilities: any, newMetadata?: any) => void;
}

export function LinkedInCapabilityPanel({ accountId, isEnterprise, capabilities, lastVerified, onVerifyComplete }: Props) {
    const [isVerifying, setIsVerifying] = useState(false)

    const handleVerify = async () => {
        setIsVerifying(true)
        try {
            const res = await fetch('/api/oauth/linkedin/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Verification failed')

            toast.success("Capabilities verified successfully")
            if (onVerifyComplete) onVerifyComplete(data.capabilities, data.metadata)

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to verify")
        } finally {
            setIsVerifying(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="size-5 text-blue-400" />
                        Feature Capabilities
                    </h3>
                    <p className="text-sm text-white/60">
                        Real-time status of your API permissions.
                    </p>
                </div>
                <div className="text-right">
                    <Button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        variant="outline"
                        className="h-11 px-6 text-sm bg-white/5 border-white/10 hover:bg-white/10"
                    >
                        <RefreshCw className={`size-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
                        {isVerifying ? 'Verifying...' : 'Re-verify Access'}
                    </Button>
                    {lastVerified && (
                        <p className="text-xs text-white/40 mt-1">
                            Last checked: {new Date(lastVerified).toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FEATURE_LIST.map((feature) => {
                    const isUnlocked = feature.key === 'enterprise_mode' ? isEnterprise : capabilities[feature.key]

                    return (
                        <div
                            key={feature.key}
                            className={`
                                relative p-4 rounded-xl border transition-all
                                ${isUnlocked
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-white/5 border-white/10 opacity-75 hover:opacity-100'}
                            `}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className={`font-bold ${isUnlocked ? 'text-white' : 'text-white/60'}`}>
                                    {feature.label}
                                </h4>
                                {isUnlocked ? (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                                        <CheckCircle className="size-3" />
                                        Available
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-xs font-bold text-white/40 bg-white/5 px-2 py-1 rounded-full">
                                        <Lock className="size-3" />
                                        Locked
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-white/60 mb-3 min-h-[40px]">
                                {feature.description}
                            </p>

                            {!isUnlocked && (
                                <div className="mt-4 pt-3 border-t border-white/5">
                                    <div className="flex items-start gap-2 text-xs text-orange-400/80 mb-2">
                                        <AlertTriangle className="size-3 mt-0.5 shrink-0" />
                                        <span>
                                            {feature.explanation || "This feature requires specific permissions not provided by LinkedIn."}
                                        </span>
                                    </div>
                                    <a
                                        href={`/linkedin-documentation#oauth`} // Link to the docs page
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                        Learn how to unlock
                                        <ExternalLink className="size-3" />
                                    </a>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="bg-blue-500/5 rounded-lg p-3 text-xs text-blue-300/60 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0" />
                Feature availability is determined strictly by LinkedIn API responses and granted OAuth scopes.
            </div>
        </div>
    )
}