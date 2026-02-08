"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Command } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        const target = e.target as typeof e.target & {
            email: { value: string }
            password: { value: string }
            name: { value: string }
        }

        const email = target.email.value
        const password = target.password.value
        const name = target.name.value

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                body: JSON.stringify({ email, password, name }),
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || "Failed to sign up")
                setIsLoading(false)
            } else {
                toast.success("Account created! Please check your email for verification.")
                // In this demo, we can show the debug token if it's there
                if (data.debugVerificationToken) {
                    console.log("Verification URL:", `${window.location.origin}/api/auth/verify?token=${data.debugVerificationToken}`)
                }
                router.push("/login?signup=success")
            }
        } catch (error) {
            toast.error("Something went wrong")
            setIsLoading(false)
        }
    }

    const handleGitHubSignup = async () => {
        setIsLoading(true)
        await signIn("github", { callbackUrl: "/dashboard" })
    }


    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black">
            <Card className="w-full max-w-md border-white/10 bg-neutral-950 text-white shadow-2xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="size-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <Command className="size-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
                    <CardDescription className="text-white/40">
                        Enter your details to get started with Socialyncara
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <form onSubmit={handleSignup} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="John Doe"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-purple-500"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-purple-500"
                                required
                            />
                        </div>
                        <Button disabled={isLoading} className="w-full bg-white text-black hover:bg-neutral-200">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Account
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-neutral-950 px-2 text-white/40">Or continue with</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        type="button"
                        disabled={isLoading}
                        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.12-1.133 8.227-3.293 2.16-2.16 2.853-5.213 2.853-7.613 0-.747-.08-1.48-.213-2.173h-10.867z" />
                            </svg>
                        )}
                        Google
                    </Button>

                    <Button
                        variant="outline"
                        type="button"
                        disabled={isLoading}
                        onClick={handleGitHubSignup}
                        className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                            </svg>
                        )}
                        GitHub
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 text-center">
                    <div className="text-sm text-white/40">
                        Already have an account?{" "}
                        <Link href="/login" className="text-white hover:underline">
                            Login
                        </Link>
                    </div>
                    <p className="text-[10px] text-white/20">Protected by Layer 1 Security</p>
                </CardFooter>
            </Card>
        </div>
    )
}
