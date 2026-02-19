import Link from 'next/link';
import { Home, Share2, BarChart3, Settings, User, Layers, Lock } from 'lucide-react';
import { UserNav } from '@/components/UserNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen bg-black text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 hidden md:flex flex-col bg-neutral-950">
                <div className="h-16 flex items-center px-6 border-b border-white/10">
                    <div className="flex items-center gap-2 font-bold text-lg">
                        <div className="size-7 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-xs">S</span>
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                            Socialyncara
                        </span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
                        Overview
                    </div>
                    <NavLink href="/dashboard" icon={Home}>Dashboard</NavLink>
                    <NavLink href="/dashboard/analytics" icon={BarChart3}>Analytics</NavLink>

                    <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider mt-6">
                        Channels
                    </div>
                    <NavLink href="/dashboard/linkedin/post" icon={Share2}>LinkedIn Composer</NavLink>
                    <NavLink href="/dashboard/composer" icon={Layers}>Universal Composer</NavLink>
                    <NavLink href="/dashboard/linkedin/control-panel" icon={Lock}>LinkedIn Controls</NavLink>

                    <div className="px-3 py-2 text-xs font-semibold text-white/40 uppercase tracking-wider mt-6">
                        Management
                    </div>
                    <NavLink href="/dashboard/connect" icon={Share2}>Connect Platforms</NavLink>
                    <NavLink href="/dashboard/queue" icon={Layers}>Queue & History</NavLink>
                    <NavLink href="/dashboard/settings" icon={Settings}>Global Settings</NavLink>
                </nav>
                <div className="p-4 border-t border-white/10">
                    <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-widest font-bold">
                        © 2026 Socialyncara
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-black">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Trigger would go here */}
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

function NavLink({ href, icon: Icon, children }: any) {
    return (
        <Link href={href} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all group">
            <Icon className="size-4 text-white/40 group-hover:text-purple-400 transition-colors" />
            {children}
        </Link>
    )
}
