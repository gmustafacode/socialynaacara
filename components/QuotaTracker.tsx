"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Activity, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function QuotaTracker() {
    const [limits, setLimits] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLimits = async () => {
            try {
                const res = await fetch('/api/user/limits?platform=linkedin')
                if (res.ok) {
                    const data = await res.json()
                    setLimits(data)
                }
            } catch (e) {
                console.error("Failed to fetch limits", e)
            } finally {
                setLoading(false)
            }
        }
        fetchLimits()
        // Refresh every 5 minutes
        const interval = setInterval(fetchLimits, 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    if (loading) {
        return (
            <div className="p-4 border-t border-white/5 animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
                <div className="h-2 bg-white/5 rounded w-full"></div>
            </div>
        )
    }

    if (!limits) return null;

    const isWarning = limits.percentage >= 80 && !limits.exhausted;
    const isCritical = limits.exhausted;

    return (
        <div className="p-4 border-t border-white/10 space-y-3 relative group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/60">
                    <Activity className="size-3.5 text-purple-400" />
                    <span>API Quota</span>
                </div>
                <span className={cn(
                    "text-xs font-black",
                    isCritical ? "text-red-400" : isWarning ? "text-amber-400" : "text-emerald-400"
                )}>
                    {limits.used} / {limits.limit}
                </span>
            </div>

            <div className="relative">
                <Progress
                    value={limits.percentage}
                    className={cn(
                        "h-1.5",
                        isCritical ? "bg-red-500/20" : isWarning ? "bg-amber-500/20" : "bg-white/10"
                    )}
                    indicatorColor={isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"}
                />
            </div>

            {isCritical && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 p-2 rounded-lg mt-2">
                    <AlertTriangle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-red-200 leading-tight">
                        Daily limit reached. Resets at midnight.
                    </p>
                </div>
            )}

            {!isCritical && limits.isRateLimited && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-2">
                    <AlertTriangle className="size-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-amber-200 leading-tight">
                        Rate limit active. Wait before posting.
                    </p>
                </div>
            )}
        </div>
    )
}
