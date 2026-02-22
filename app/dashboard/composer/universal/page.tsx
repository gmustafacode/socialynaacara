"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlignLeft, ImageIcon, Video, Layers, Layout, Users, Sparkles, ChevronRight, Share2, Globe, Command } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const POST_TYPES = [
    {
        id: "text",
        label: "Text Only",
        description: "Pure text-based updates. Great for thought leadership and quick updates.",
        icon: AlignLeft,
        color: "blue"
    },
    {
        id: "image",
        label: "Images",
        description: "Post single or multiple images. Perfect for visual storytelling.",
        icon: ImageIcon,
        color: "purple"
    },
    {
        id: "video",
        label: "Videos",
        description: "Upload and schedule video content across all platforms.",
        icon: Video,
        color: "emerald"
    },
    {
        id: "text-images",
        label: "Text + Images",
        description: "Rich posts with both descriptive text and visual media.",
        icon: Layers,
        color: "orange"
    },
    {
        id: "text-video",
        label: "Text + Videos",
        description: "Engaging video content paired with compelling copy.",
        icon: Layout,
        color: "red"
    },
    {
        id: "all",
        label: "All Other Types",
        description: "Dynamic posts, carousels, and platform-specific formats.",
        icon: Users,
        color: "pink"
    },
]

export default function UniversalSelectionPage() {
    const router = useRouter()

    return (
        <div className="space-y-12 animate-in fade-in duration-700 pb-20">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Command className="size-5 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Universal Composer</h1>
                </div>
                <p className="text-white/40 text-lg max-w-2xl">
                    What type of post do you want to automate today? Select a format to begin the multi-platform configuration.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {POST_TYPES.map((type) => (
                    <Card
                        key={type.id}
                        onClick={() => router.push(`/dashboard/composer/universal/${type.id}`)}
                        className="group relative bg-neutral-900 border-white/10 hover:border-white/20 transition-all cursor-pointer overflow-hidden rounded-[2rem]"
                    >
                        <CardHeader className="relative z-10 pb-2">
                            <div className={cn(
                                "size-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                                type.color === "blue" && "bg-blue-500/20 text-blue-400",
                                type.color === "purple" && "bg-purple-500/20 text-purple-400",
                                type.color === "emerald" && "bg-emerald-500/20 text-emerald-400",
                                type.color === "orange" && "bg-orange-500/20 text-orange-400",
                                type.color === "red" && "bg-red-500/20 text-red-400",
                                type.color === "pink" && "bg-pink-500/20 text-pink-400",
                            )}>
                                <type.icon className="size-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">
                                {type.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <CardDescription className="text-white/40 group-hover:text-white/60 transition-colors">
                                {type.description}
                            </CardDescription>
                            <div className="mt-6 flex items-center text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">
                                Start Configuring <ChevronRight className="size-3 ml-1" />
                            </div>
                        </CardContent>

                        {/* Decorative background flair */}
                        <div className={cn(
                            "absolute -right-4 -bottom-4 size-32 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
                            type.color === "blue" && "bg-blue-500",
                            type.color === "purple" && "bg-purple-500",
                            type.color === "emerald" && "bg-emerald-500",
                            type.color === "orange" && "bg-orange-500",
                            type.color === "red" && "bg-red-500",
                            type.color === "pink" && "bg-pink-500",
                        )} />
                    </Card>
                ))}
            </div>

            <div className="flex items-center justify-center p-8 border border-white/5 bg-white/[0.02] rounded-[3rem] mt-12">
                <div className="flex flex-col items-center text-center gap-4">
                    <p className="text-xs text-white/40 uppercase tracking-[0.3em] font-black">AI Orchestration Layer</p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                            <Share2 className="size-3 text-purple-500" /> Multi-Platform Sync
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white/60">
                            <Globe className="size-3 text-blue-500" /> Universal Reach
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
