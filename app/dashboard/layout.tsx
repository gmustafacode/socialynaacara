"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Share2, BarChart3, Settings, Layers, Lock, Menu, X, User, Sparkles } from 'lucide-react';
import { UserNav } from '@/components/UserNav';
import { QuotaTracker } from '@/components/QuotaTracker';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && pathname !== '/onboarding') {
            checkOnboarding();
        }
    }, [status, pathname]);

    const checkOnboarding = async () => {
        try {
            const res = await fetch(`/api/preferences/${(session?.user as any)?.id}`);
            if (res.ok) {
                const prefs = await res.json();
                if (prefs && prefs.onboardingCompleted === false) {
                    router.push('/onboarding');
                }
            }
        } catch (e) {
            console.error("Failed to check onboarding status");
        }
    };

    const navItems = [
        {
            section: 'Overview', items: [
                { href: '/dashboard', icon: Home, label: 'Dashboard', exact: true },
                { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
                { href: '/dashboard/calendar', icon: Layers, label: 'Content Calendar' },
            ]
        },
        {
            section: 'Channels', items: [
                { href: '/dashboard/composer', icon: Sparkles, label: 'Smart Composer' },
                { href: '/dashboard/linkedin/post', icon: Share2, label: 'Legacy Composer' },
                { href: '/dashboard/linkedin/control-panel', icon: Lock, label: 'LinkedIn Controls' },
            ]
        },
        {
            section: 'Management', items: [
                { href: '/dashboard/user-information', icon: User, label: 'User Information' },
                { href: '/dashboard/connect', icon: Share2, label: 'Connect Platforms' },
                { href: '/dashboard/queue', icon: Layers, label: 'Queue & History' },
                { href: '/dashboard/settings', icon: Settings, label: 'Global Settings' },
            ]
        },
    ];

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + '/');
    };

    const SidebarContent = () => (
        <>
            <div className="h-16 flex items-center px-6 border-b border-white/10">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                    <div className="size-7 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-xs">S</span>
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        Socialyncara
                    </span>
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((group) => (
                    <div key={group.section}>
                        <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider mt-4 first:mt-0">
                            {group.section}
                        </div>
                        {group.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                    isActive(item.href, item.exact)
                                        ? "bg-purple-500/10 text-white border border-purple-500/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <item.icon className={cn(
                                    "size-4 transition-colors",
                                    isActive(item.href, item.exact)
                                        ? "text-purple-400"
                                        : "text-white/40 group-hover:text-purple-400"
                                )} />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
            <QuotaTracker />
            <div className="p-4 border-t border-white/10">
                <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-widest font-bold">
                    © 2026 Socialyncara
                </div>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col bg-neutral-950">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
                    <aside className="relative w-72 h-full bg-neutral-950 border-r border-white/10 flex flex-col animate-in slide-in-from-left duration-300 shadow-2xl">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-black">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Trigger */}
                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </button>
                        <h1 className="font-semibold text-sm text-white/80">Workspace / Social Layer 1</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <UserNav />
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
