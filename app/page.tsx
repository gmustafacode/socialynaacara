import Link from "next/link";
import { Button } from "@/components/ui/button"; // Will exist after Shadcn Setup or I'll create it
import { ArrowRight, LayoutDashboard, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-black/50">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="size-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <span className="text-white">S</span>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
            Socialyncara
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-white/60">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-white transition-colors">About</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <span className="text-sm font-medium text-white/80 hover:text-white cursor-pointer px-4 py-2 hover:bg-white/5 rounded-md transition-all">
              Login
            </span>
          </Link>
          <Link href="/signup">
            <button className="bg-white text-black px-4 py-2 rounded-md text-sm font-bold hover:bg-gray-200 transition-colors">
              Get Started
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">

        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-purple-600/30 blur-[100px] rounded-full pointer-events-none -z-10" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[400px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            <span>✨ Introducing Socialyncara v2.0</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.05]">
            Architect Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 animate-gradient">
              Social Presence
            </span>
          </h1>

          <p className="text-lg md:text-2xl text-white/50 max-w-3xl mx-auto leading-relaxed font-light">
            The next-generation AI command center for LinkedIn, X, Instagram, and more.
            Automate with precision, secure with AES-256.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <Link href="/dashboard">
              <button className="h-14 px-10 rounded-2xl bg-white text-black font-bold flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                <LayoutDashboard className="size-5" />
                Launch Dashboard
              </button>
            </Link>
            <Link href="/signup">
              <button className="h-14 px-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold flex items-center gap-3 transition-all backdrop-blur-xl group">
                <Lock className="size-5 text-white/40 group-hover:text-purple-400 transition-colors" />
                Start Building Free
              </button>
            </Link>
          </div>
        </div>

        {/* Mock Interface Preview */}
        <div className="mt-20 w-full max-w-5xl aspect-video rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center text-white/20 font-mono text-sm">
            [Dashboard Preview Placeholder]
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-white/40 text-sm bg-black">
        <p>© 2026 Socialyncara. All rights reserved.</p>
      </footer>
    </div>
  );
}