"use client"

import { Info, ShieldCheck, ShieldAlert, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function PlatformPolicyCard() {
    const policies = [
        { platform: "LinkedIn", free: "10-20 posts/mo", paid: "Unlimited", status: "limited", color: "text-blue-400" },
        { platform: "X (Twitter)", free: "Read-only / 1 post/day", paid: "Full API / 500+ posts", status: "restricted", color: "text-white" },
        { platform: "Instagram", free: "Manual approval needed", paid: "Direct autoposting", status: "dynamic", color: "text-pink-400" },
        { platform: "YouTube", free: "10k quota units", paid: "Higher quota", status: "limited", color: "text-red-400" },
    ]

    return (
        <Card className="bg-neutral-900 border-white/10 text-white shadow-xl">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="size-5 text-purple-400" />
                    <CardTitle className="text-lg">Platform Policies & Limits</CardTitle>
                </div>
                <CardDescription className="text-white/40">Real-time automation capabilities across connected platforms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {policies.map((p) => (
                    <div key={p.platform} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`size-2 rounded-full ${p.status === 'restricted' ? 'bg-red-500' : 'bg-green-500'}`} />
                            <span className={`font-medium ${p.color}`}>{p.platform}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-white/80">Free: {p.free}</p>
                            <p className="text-[10px] text-white/40">Paid: {p.paid}</p>
                        </div>
                    </div>
                ))}

                <div className="pt-2 flex items-center gap-2 text-[10px] text-white/30 bg-purple-500/5 p-2 rounded border border-purple-500/10">
                    <Zap className="size-3 text-purple-400" />
                    <span>Dynamic policy updates active: Platform rules refreshed 2h ago.</span>
                </div>
            </CardContent>
        </Card>
    )
}
