"use client"

import React, { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, getDay, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Link2, Share2, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true)
            try {
                const res = await fetch('/api/calendar')
                if (res.ok) {
                    const data = await res.json()
                    setEvents(data)
                }
            } catch (e) {
                console.error("Failed to fetch calendar events", e)
            } finally {
                setLoading(false)
            }
        }
        fetchEvents()
    }, [])

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = monthStart
    let adjustedStartDate = new Date(startDate)
    // Adjust to get the first Sunday of the calendar view
    adjustedStartDate.setDate(adjustedStartDate.getDate() - getDay(adjustedStartDate))

    const endDate = monthEnd
    let adjustedEndDate = new Date(endDate)
    // Adjust to get the last Saturday of the calendar view
    adjustedEndDate.setDate(adjustedEndDate.getDate() + (6 - getDay(adjustedEndDate)))

    const dateRange = eachDayOfInterval({
        start: adjustedStartDate,
        end: adjustedEndDate
    })

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const goToToday = () => setCurrentDate(new Date())

    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'published') return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (s === 'failed') return "bg-red-500/10 text-red-400 border-red-500/20";
        if (s === 'processing' || s === 'draft') return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        return "bg-purple-500/10 text-purple-400 border-purple-500/20"; // pending / scheduled
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-white">Content Calendar</h2>
                    <p className="text-white/40 mt-1">AI-driven scheduling, orchestration, and historical view.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 font-semibold rounded-xl text-sm transition-colors border border-white/10"
                    >
                        Today
                    </button>
                    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="w-32 text-center text-sm font-bold text-white uppercase tracking-wider">
                            {format(currentDate, "MMMM yyyy")}
                        </span>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            <Card className="border-white/10 bg-neutral-900/50 backdrop-blur-md overflow-hidden rounded-[2rem] shadow-2xl">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-[2rem]">
                        <Loader2 className="size-10 text-purple-500 animate-spin" />
                    </div>
                )}
                <div className="grid grid-cols-7 border-b border-white/10 bg-black/40">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="py-4 text-center text-xs font-black text-white/40 uppercase tracking-widest border-r border-white/5 last:border-0">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 bg-neutral-900 border-b border-white/10 last:border-0">
                    {dateRange.map((day, i) => {
                        const dayEvents = events.filter(e => isSameDay(new Date(e.date), day))
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "min-h-[140px] p-2 border-r border-b border-white/5 transition-colors group relative",
                                    !isSameMonth(day, currentDate) ? "bg-black/40" : "hover:bg-white/5",
                                    i % 7 === 6 ? "border-r-0" : ""
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "text-xs font-bold size-7 flex items-center justify-center rounded-xl",
                                        isToday(day)
                                            ? "bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                            : !isSameMonth(day, currentDate)
                                                ? "text-white/20"
                                                : "text-white/60 group-hover:text-white"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-col gap-1.5 max-h-[100px] overflow-y-auto scrollbar-none">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className={cn(
                                                "px-2 py-1.5 rounded-lg border text-[10px] font-medium leading-tight cursor-default flex flex-col gap-1",
                                                getStatusStyles(event.status)
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 font-black uppercase tracking-wider text-[8px] opacity-80">
                                                    {event.platform === 'linkedin' ? <Share2 className="size-2.5" /> : <Layers className="size-2.5" />}
                                                    {event.platform}
                                                </div>
                                                <span className="text-[8px] opacity-70 font-semibold">{format(new Date(event.date), "HH:mm")}</span>
                                            </div>
                                            <p className="truncate opacity-90">{event.title || 'No summary'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/40 justify-center">
                <div className="flex items-center gap-2"><div className="size-2.5 rounded bg-purple-500/20 border border-purple-500/50"></div> Scheduled</div>
                <div className="flex items-center gap-2"><div className="size-2.5 rounded bg-emerald-500/20 border border-emerald-500/50"></div> Published</div>
                <div className="flex items-center gap-2"><div className="size-2.5 rounded bg-amber-500/20 border border-amber-500/50"></div> Processing/Draft</div>
                <div className="flex items-center gap-2"><div className="size-2.5 rounded bg-red-500/20 border border-red-500/50"></div> Failed</div>
            </div>
        </div>
    )
}
