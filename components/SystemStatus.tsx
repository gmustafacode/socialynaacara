"use client"

import React, { useState, useEffect } from "react"
import { Activity, Shield, Cpu, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function SystemStatus() {
    const [status, setStatus] = useState<'online' | 'warning' | 'error'>('online')
    const [lastSync, setLastSync] = useState<string>('Just now')
    const [details, setDetails] = useState({
        nodes: 1,
        latency: '24ms',
        security: 'AES-256'
    })

    useEffect(() => {
        // Mocking live telemetry for aesthetics
        const interval = setInterval(() => {
            setLastSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-wrap items-center gap-6 p-4 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 pr-6 border-r border-white/5">
                <div className="relative">
                    <Activity className={cn(
                        "size-5",
                        status === 'online' ? "text-emerald-500" : "text-amber-500"
                    )} />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Distribution Engine</p>
                    <p className="text-xs font-bold text-white uppercase">Operational</p>
                </div>
            </div>

            <div className="flex items-center gap-3 pr-6 border-r border-white/5">
                <Cpu className="size-5 text-blue-500" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Last Sync</p>
                    <p className="text-xs font-bold text-white">{lastSync}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 pr-6 border-r border-white/5">
                <Shield className="size-5 text-purple-500" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Protocol</p>
                    <p className="text-xs font-bold text-white">Encrypted-End</p>
                </div>
            </div>

            <div className="hidden md:flex ml-auto items-center gap-3">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="size-6 rounded-full border-2 border-black bg-neutral-800 flex items-center justify-center overflow-hidden">
                            <div className="size-2 rounded-full bg-emerald-500/50" />
                        </div>
                    ))}
                </div>
                <p className="text-[9px] font-black uppercase tracking-tighter text-white/40">Active Nodes: 03</p>
            </div>
        </div>
    )
}
