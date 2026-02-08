
"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Check, AlertTriangle, Linkedin } from 'lucide-react'

export default function AccountsPage() {
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch('/api/accounts')
                if (res.ok) {
                    const data = await res.json()
                    // Filter for active accounts or display all with status
                    setAccounts(data)
                }
            } catch (error) {
                console.error("Failed to fetch accounts", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAccounts()
    }, [])

    if (loading) {
        return <div className="text-white">Loading accounts...</div>
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Accounts Information</h2>
                <p className="text-white/60">Select an account to manage posts and scheduling.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                    <Link
                        href={`/dashboard/accounts/${account.platform.toLowerCase()}/${account.id}`}
                        key={account.id}
                        className="block group"
                    >
                        <Card className="bg-neutral-900 border-white/10 hover:border-purple-500/50 transition-all cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-white">
                                    {account.platform === 'linkedin' ? 'LinkedIn' : account.platform}
                                </CardTitle>
                                {account.platform === 'linkedin' && <Linkedin className="h-4 w-4 text-blue-500" />}
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white mb-1">
                                    {account.metadata?.username || account.platformAccountId || 'Connected User'}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    {account.status === 'active' ? (
                                        <span className="flex items-center text-green-500 gap-1">
                                            <Check className="h-3 w-3" /> Connected
                                        </span>
                                    ) : (
                                        <span className="flex items-center text-red-500 gap-1">
                                            <AlertTriangle className="h-3 w-3" /> {account.status}
                                        </span>
                                    )}
                                    <span className="text-white/40">•</span>
                                    <span className="text-white/40 capitalize">{account.type || 'Profile'}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {accounts.length === 0 && (
                    <div className="col-span-full text-center py-12 border border-dashed border-white/10 rounded-lg">
                        <p className="text-white/40 mb-4">No connected accounts found.</p>
                        <Link href="/dashboard/connect">
                            <Button variant="outline">Connect an Account</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
