"use client"

import { signOut, useSession } from "next-auth/react"
import { LogOut, User as UserIcon, Settings } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function UserNav() {
    const { data: session, status } = useSession()
    const user = session?.user

    if (status === "unauthenticated") {
        return (
            <div className="flex items-center gap-3">
                <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-widest">
                        Log In
                    </Button>
                </Link>
                <Link href="/register">
                    <Button size="sm" className="bg-white text-black hover:bg-neutral-200 text-xs font-bold uppercase tracking-widest px-4 shadow-lg shadow-white/5">
                        Sign Up
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 px-2 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 cursor-pointer transition-all active:scale-95 group">
                    <div className="size-7 rounded-full bg-neutral-800 flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors overflow-hidden ring-1 ring-white/10">
                        {user?.image ? (
                            <img src={user.image} alt={user.name || ""} className="size-full object-cover" />
                        ) : (
                            <UserIcon className="size-3.5 text-white/50 group-hover:text-purple-400" />
                        )}
                    </div>
                    <div className="hidden lg:block text-left pr-2">
                        <p className="text-xs font-bold truncate group-hover:text-white transition-colors">
                            {user?.name?.split(' ')[0] || "User"}
                        </p>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-neutral-900 border-white/10 text-white shadow-2xl" align="end" sideOffset={8}>
                <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-1.5">
                        <p className="text-sm font-bold leading-none">{user?.name}</p>
                        <p className="text-[10px] uppercase tracking-tighter leading-none text-white/40">
                            {user?.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild className="hover:bg-white/5 cursor-pointer py-2.5">
                    <Link href="/dashboard/settings" className="flex w-full items-center">
                        <Settings className="mr-2 h-4 w-4 text-white/40" />
                        <span className="text-sm font-medium">Global Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                    className="hover:bg-red-500/10 text-red-500 cursor-pointer py-2.5 focus:bg-red-500/20 focus:text-red-400"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="text-sm font-bold">Log out session</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
