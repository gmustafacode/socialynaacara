"use client"

import React, { useState, useEffect } from 'react'
import { Search, Book, Shield, Code, AlertCircle, CheckCircle, ChevronRight, ExternalLink, ArrowLeft, Home } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LinkedInDocumentationPage() {
    const [activeSection, setActiveSection] = useState('setup')
    const [searchQuery, setSearchQuery] = useState('')

    // Smooth scroll to section
    const scrollToSection = (sectionId: string) => {
        setActiveSection(sectionId)
        const element = document.getElementById(sectionId)
        if (element) {
            const offset = 100
            const elementPosition = element.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - offset

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            })
        }
    }

    // Track scroll position to update active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = ['setup', 'oauth', 'credentials', 'errors', 'faq', 'technical']
            const scrollPosition = window.scrollY + 150

            for (const section of sections) {
                const element = document.getElementById(section)
                if (element) {
                    const { offsetTop, offsetHeight } = element
                    if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                        setActiveSection(section)
                        break
                    }
                }
            }
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const sections = [
        { id: 'setup', title: 'Setup Guide', icon: <Book className="size-4" /> },
        { id: 'oauth', title: 'OAuth & Scopes', icon: <Shield className="size-4" /> },
        { id: 'credentials', title: 'Credentials', icon: <Code className="size-4" /> },
        { id: 'errors', title: 'Troubleshooting', icon: <AlertCircle className="size-4" /> },
        { id: 'faq', title: 'FAQ', icon: <CheckCircle className="size-4" /> },
        { id: 'technical', title: 'Technical Docs', icon: <Code className="size-4" /> }
    ]

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/connect">
                                <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                                    <ArrowLeft className="size-4 mr-2" />
                                    Back to Connect
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-white/10" />
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                <div className="p-2 bg-blue-600 rounded-lg">
                                    <Book className="size-5" />
                                </div>
                                LinkedIn Documentation
                            </h1>
                        </div>
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                                <Home className="size-4 mr-2" />
                                Dashboard
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="w-64 shrink-0 sticky top-24 h-fit">
                        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-4">
                            {/* Search */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                                    <Input
                                        placeholder="Search docs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 bg-white/5 border-white/10 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="space-y-1">
                                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                                    Table of Contents
                                </p>
                                {sections.map((section) => (
                                    <button
                                        key={section.id}
                                        onClick={() => scrollToSection(section.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm transition-all ${activeSection === section.id
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {section.icon}
                                        <span>{section.title}</span>
                                        {activeSection === section.id && (
                                            <ChevronRight className="size-4 ml-auto" />
                                        )}
                                    </button>
                                ))}
                            </nav>

                            {/* External Link */}
                            <div className="mt-6 pt-4 border-t border-white/10">
                                <a
                                    href="https://www.linkedin.com/developers/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    <ExternalLink className="size-3" />
                                    LinkedIn Developer Portal
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 max-w-4xl">
                        <div className="prose prose-invert max-w-none space-y-16">
                            {/* Setup Guide Section */}
                            <section id="setup" className="scroll-mt-24">
                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-8">
                                    <h2 className="text-3xl font-bold text-blue-400 mb-3 flex items-center gap-3">
                                        <Book className="size-8" />
                                        Setup Guide
                                    </h2>
                                    <p className="text-white/70 text-base">
                                        Follow these steps to connect your LinkedIn account to SocialyNikara.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    {/* Step 1 */}
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                                                1
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-2">Create a LinkedIn App</h3>
                                                <p className="text-sm text-white/60 mb-4">
                                                    Go to the LinkedIn Developer Portal and create a new app.
                                                </p>
                                                <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 ml-4">
                                                    <li>Visit <a href="https://www.linkedin.com/developers/apps" target="_blank" className="text-blue-400 underline">LinkedIn Developer Portal</a></li>
                                                    <li>Click <strong className="text-white">"Create app"</strong></li>
                                                    <li>Fill in app details (name, LinkedIn Page, logo)</li>
                                                    <li>Enter your <strong className="text-white">Privacy Policy URL</strong> (Required)</li>
                                                    <li>Agree to terms and click <strong className="text-white">"Create app"</strong></li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Step - CRITICAL */}
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 bg-red-500/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                                        <div className="flex items-start gap-4 relative z-10">
                                            <div className="size-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center font-bold text-xl shrink-0 border border-red-500/20">
                                                !
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-red-400 mb-2">Mandatory: Verify App Ownership</h3>
                                                <p className="text-sm text-white/80 mb-4">
                                                    Account access <strong className="text-white">will fail</strong> if your app is not verified. You must prove ownership of the linked LinkedIn Page.
                                                </p>

                                                <div className="space-y-4">
                                                    <div className="bg-neutral-900/50 rounded-lg p-4 border border-white/5">
                                                        <h4 className="text-sm font-bold text-white mb-2">How to Verify:</h4>
                                                        <ol className="list-decimal list-inside space-y-2 text-sm text-white/70">
                                                            <li>In your App Settings, look for the <strong className="text-white">"Company"</strong> or <strong className="text-white">"Settings"</strong> section.</li>
                                                            <li>Click <strong className="text-white">"Verify"</strong> next to your Company Page.</li>
                                                            <li>Click <strong className="text-white">"Generate URL"</strong> to create a verification link.</li>
                                                            <li>Send this link to the <strong className="text-white">Page Administrator</strong> (or open it yourself if you are the admin).</li>
                                                            <li>The admin must click <strong className="text-white">"Verify"</strong> on that page.</li>
                                                        </ol>
                                                    </div>

                                                    <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                                                        <CheckCircle className="size-5 text-green-500 shrink-0" />
                                                        <div className="text-sm">
                                                            <p className="text-white/90 font-medium">Success Indicator</p>
                                                            <p className="text-white/60 text-xs">Your app settings must show: <span className="font-mono text-green-400">Verified: [Date]</span></p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 2 */}
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                                                2
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-2">Request Required Products</h3>
                                                <p className="text-sm text-white/60 mb-4">
                                                    Your app needs access to specific LinkedIn products.
                                                </p>
                                                <div className="space-y-3 mb-4">
                                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-bold text-white">Share on LinkedIn</h4>
                                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Required</span>
                                                        </div>
                                                        <p className="text-xs text-white/50 mb-2">Default Tier</p>
                                                        <p className="text-sm text-white/70">Allows posting content to LinkedIn</p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <h4 className="font-bold text-white">Sign In with LinkedIn using OpenID Connect</h4>
                                                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Required</span>
                                                        </div>
                                                        <p className="text-xs text-white/50 mb-2">Standard Tier</p>
                                                        <p className="text-sm text-white/70">Enables authentication and profile access</p>
                                                    </div>
                                                </div>
                                                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                                                    <p className="text-xs text-yellow-400">
                                                        ⚠️ <strong>Important:</strong> Wait until both products show "Approved" status before proceeding.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 3 */}
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                                                3
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-2">Configure OAuth Settings</h3>
                                                <p className="text-sm text-white/60 mb-4">
                                                    Set up authentication credentials and redirect URLs.
                                                </p>
                                                <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 ml-4">
                                                    <li>Go to the <strong className="text-white">"Auth"</strong> tab in your app</li>
                                                    <li>Copy your <strong className="text-white">Client ID</strong></li>
                                                    <li>Generate and copy your <strong className="text-white">Client Secret</strong></li>
                                                    <li>Add redirect URL: <code className="bg-black/40 px-2 py-1 rounded text-blue-400 font-mono text-xs">http://localhost:3000/api/oauth/callback</code></li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Step 4 */}
                                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                        <div className="flex items-start gap-4">
                                            <div className="size-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                                                4
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-2">Connect in SocialyNikara</h3>
                                                <p className="text-sm text-white/60 mb-4">
                                                    Use your credentials to establish the connection.
                                                </p>
                                                <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 ml-4">
                                                    <li>Click the <strong className="text-white">"Connect LinkedIn"</strong> button</li>
                                                    <li>Enter your Client ID and Client Secret</li>
                                                    <li>Verify the redirect URI matches</li>
                                                    <li>Check the acknowledgment box</li>
                                                    <li>Click <strong className="text-white">"Initiate Handshake"</strong></li>
                                                    <li>Authorize on LinkedIn when prompted</li>
                                                </ol>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* OAuth & Scopes Section */}
                            <section id="oauth" className="scroll-mt-24">
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6 mb-8">
                                    <h2 className="text-3xl font-bold text-purple-400 mb-3 flex items-center gap-3">
                                        <Shield className="size-8" />
                                        OAuth 2.0 Scopes (Optional)
                                    </h2>
                                    <p className="text-white/70 text-base">
                                        Scopes define what your app can access on behalf of the user.
                                    </p>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <code className="text-sm font-mono text-purple-400">openid</code>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Required</span>
                                        </div>
                                        <p className="text-sm text-white/70">Required for OpenID Connect authentication</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <code className="text-sm font-mono text-purple-400">profile</code>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Required</span>
                                        </div>
                                        <p className="text-sm text-white/70">Access to basic profile information (name, photo)</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <code className="text-sm font-mono text-purple-400">email</code>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Required</span>
                                        </div>
                                        <p className="text-sm text-white/70">Access to primary email address</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-center justify-between mb-2">
                                            <code className="text-sm font-mono text-purple-400">w_member_social</code>
                                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Required</span>
                                        </div>
                                        <p className="text-sm text-white/70">Permission to create, modify, and delete posts</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-6">
                                    <h3 className="font-bold text-white mb-4 text-lg">How Scopes Work</h3>
                                    <ul className="space-y-2 text-sm text-white/70">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-purple-400 shrink-0" />
                                            <span>Scopes are requested during the OAuth authorization flow</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-purple-400 shrink-0" />
                                            <span>Users see a consent screen showing what permissions you're requesting</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-purple-400 shrink-0" />
                                            <span>Your app can only access data covered by approved scopes</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-purple-400 shrink-0" />
                                            <span>Scopes are tied to the products approved for your LinkedIn app</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Credentials Section */}
                            <section id="credentials" className="scroll-mt-24">
                                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 mb-8">
                                    <h2 className="text-3xl font-bold text-green-400 mb-3 flex items-center gap-3">
                                        <Code className="size-8" />
                                        Required Credentials
                                    </h2>
                                    <p className="text-white/70 text-base">
                                        You'll need these credentials from your LinkedIn app to establish a connection.
                                    </p>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {/* Client ID */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-white">Client ID</h3>
                                        </div>
                                        <p className="text-sm text-white/70 mb-3">Unique identifier for your LinkedIn app</p>
                                        <div className="bg-black/30 rounded p-3 mb-3">
                                            <p className="text-xs text-white/50 mb-1">Example:</p>
                                            <code className="text-sm font-mono text-green-400">7m9jyuh878hu8othg7yu9ak5vvmvq</code>
                                        </div>
                                        <p className="text-xs text-white/50">
                                            <strong className="text-white">How to find:</strong> Found in the 'Auth' tab of your LinkedIn app
                                        </p>
                                    </div>

                                    {/* Client Secret */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-white">Client Secret</h3>
                                            <Shield className="size-4 text-red-400" />
                                        </div>
                                        <p className="text-sm text-white/70 mb-3">Secret key for authenticating your app</p>
                                        <div className="bg-black/30 rounded p-3 mb-3">
                                            <p className="text-xs text-white/50 mb-1">Example:</p>
                                            <code className="text-sm font-mono text-green-400">YOUR_CLIENT_SECRET</code>
                                        </div>
                                        <p className="text-xs text-white/50">
                                            <strong className="text-white">How to find:</strong> Generate in the 'Auth' tab - copy immediately as it's only shown once
                                        </p>
                                    </div>

                                    {/* Redirect URI */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-white">Redirect URI</h3>
                                        </div>
                                        <p className="text-sm text-white/70 mb-3">URL where LinkedIn sends users after authorization</p>
                                        <div className="bg-black/30 rounded p-3 mb-3">
                                            <p className="text-xs text-white/50 mb-1">Example:</p>
                                            <code className="text-sm font-mono text-green-400">http://localhost:3000/api/oauth/callback</code>
                                        </div>
                                        <p className="text-xs text-white/50">
                                            <strong className="text-white">How to find:</strong> Auto-filled in SocialyNikara - must match exactly in LinkedIn app settings
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                    <h3 className="font-bold text-red-400 mb-3 flex items-center gap-2 text-lg">
                                        <Shield className="size-5" />
                                        Security Best Practices
                                    </h3>
                                    <ul className="space-y-2 text-sm text-white/70">
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-red-400 shrink-0" />
                                            <span><strong className="text-white">Never share</strong> your Client Secret publicly</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-red-400 shrink-0" />
                                            <span><strong className="text-white">Regenerate</strong> your secret if you suspect it's been compromised</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-red-400 shrink-0" />
                                            <span><strong className="text-white">Store securely</strong> - SocialyNikara encrypts all credentials with AES-256</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <ChevronRight className="size-4 mt-0.5 text-red-400 shrink-0" />
                                            <span><strong className="text-white">Use HTTPS</strong> in production environments</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>

                            {/* Troubleshooting Section */}
                            <section id="errors" className="scroll-mt-24">
                                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6 mb-8">
                                    <h2 className="text-3xl font-bold text-orange-400 mb-3 flex items-center gap-3">
                                        <AlertCircle className="size-8" />
                                        Common Issues & Solutions
                                    </h2>
                                    <p className="text-white/70 text-base">
                                        Quick fixes for the most common LinkedIn connection errors.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Error 1 */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <code className="text-sm font-mono text-red-400">unauthorized_scope_error</code>
                                                <p className="text-sm text-white/70 mt-1">Requesting scopes that aren't approved for your app</p>
                                            </div>
                                        </div>
                                        <div className="ml-8">
                                            <p className="text-xs font-bold text-white mb-2">Solution:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                                                <li>Go to LinkedIn Developer Portal → Your App → Products tab</li>
                                                <li>Ensure 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect' are approved</li>
                                                <li>Wait for approval if status shows 'Pending'</li>
                                                <li>Try connecting again after approval</li>
                                            </ol>
                                        </div>
                                    </div>

                                    {/* Error 2 */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <code className="text-sm font-mono text-red-400">redirect_uri_mismatch</code>
                                                <p className="text-sm text-white/70 mt-1">The redirect URI doesn't match what's configured in your LinkedIn app</p>
                                            </div>
                                        </div>
                                        <div className="ml-8">
                                            <p className="text-xs font-bold text-white mb-2">Solution:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                                                <li>Go to LinkedIn Developer Portal → Your App → Auth tab</li>
                                                <li>Verify 'http://localhost:3000/api/oauth/callback' is in 'Authorized redirect URLs'</li>
                                                <li>Check for trailing slashes (should NOT have one)</li>
                                                <li>Ensure correct protocol (http for localhost, https for production)</li>
                                                <li>Update and save if needed</li>
                                            </ol>
                                        </div>
                                    </div>

                                    {/* Error 3 */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <code className="text-sm font-mono text-red-400">invalid_client_id / invalid_client_secret</code>
                                                <p className="text-sm text-white/70 mt-1">Credentials don't match what's in your LinkedIn app</p>
                                            </div>
                                        </div>
                                        <div className="ml-8">
                                            <p className="text-xs font-bold text-white mb-2">Solution:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                                                <li>Go to LinkedIn Developer Portal → Your App → Auth tab</li>
                                                <li>Verify the Client ID matches exactly</li>
                                                <li>If Client Secret is wrong, click 'Generate a new Client Secret'</li>
                                                <li>Copy the new secret immediately</li>
                                                <li>Try connecting again with correct credentials</li>
                                            </ol>
                                        </div>
                                    </div>

                                    {/* Error 4 */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <code className="text-sm font-mono text-red-400">access_denied</code>
                                                <p className="text-sm text-white/70 mt-1">User clicked 'Cancel' or app doesn't have required permissions</p>
                                            </div>
                                        </div>
                                        <div className="ml-8">
                                            <p className="text-xs font-bold text-white mb-2">Solution:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                                                <li>Try the connection process again</li>
                                                <li>Click 'Allow' when LinkedIn asks for permissions</li>
                                                <li>Ensure your LinkedIn app has both required products approved</li>
                                                <li>Check that you're logged into the correct LinkedIn account</li>
                                            </ol>
                                        </div>
                                    </div>

                                    {/* Error 5 */}
                                    <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                                            <div>
                                                <code className="text-sm font-mono text-red-400">Connection shows 'Needs Re-authentication'</code>
                                                <p className="text-sm text-white/70 mt-1">Access token has expired or been revoked</p>
                                            </div>
                                        </div>
                                        <div className="ml-8">
                                            <p className="text-xs font-bold text-white mb-2">Solution:</p>
                                            <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                                                <li>Click the 'Re-authenticate' button on the LinkedIn card</li>
                                                <li>You'll be redirected to LinkedIn to re-authorize</li>
                                                <li>Click 'Allow' to grant permissions again</li>
                                                <li>Connection will be restored</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* FAQ Section */}
                            <section id="faq" className="scroll-mt-24">
                                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6 mb-8">
                                    <h2 className="text-3xl font-bold text-cyan-400 mb-3 flex items-center gap-3">
                                        <CheckCircle className="size-8" />
                                        Frequently Asked Questions
                                    </h2>
                                    <p className="text-white/70 text-base">
                                        Answers to common questions about LinkedIn integration.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">Do I need a LinkedIn Page to create an app?</h3>
                                        <p className="text-sm text-white/70">Yes, LinkedIn requires you to associate your app with a LinkedIn Page. You can create a free LinkedIn Page if you don't have one.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">How long does product approval take?</h3>
                                        <p className="text-sm text-white/70">For 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect', approval is usually instant. However, it can take up to 24 hours in some cases.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">Can I connect multiple LinkedIn accounts?</h3>
                                        <p className="text-sm text-white/70">Yes! Each account requires its own LinkedIn app. Simply create a new app for each account you want to connect, and follow the setup process for each one.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">How long do access tokens last?</h3>
                                        <p className="text-sm text-white/70">LinkedIn access tokens expire after 60 days. SocialyNikara automatically refreshes your tokens before they expire, so you don't need to worry about re-authenticating.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">What happens if I regenerate my Client Secret?</h3>
                                        <p className="text-sm text-white/70">If you regenerate your Client Secret in LinkedIn, you'll need to reconnect your account in SocialyNikara with the new secret. The old connection will stop working.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">Is my data secure?</h3>
                                        <p className="text-sm text-white/70">Yes! SocialyNikara uses AES-256 encryption to store all your credentials and tokens. Your Client Secret and access tokens are never stored in plain text.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                        <h3 className="font-bold text-white mb-2">Can I use this in production?</h3>
                                        <p className="text-sm text-white/70">Yes! When deploying to production, update your redirect URI in both your LinkedIn app and SocialyNikara to use your production domain with HTTPS.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Technical Docs Section */}
                            <section id="technical" className="scroll-mt-24">
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6 mb-8">
                                    <h2 className="text-3xl font-bold text-indigo-400 mb-3 flex items-center gap-3">
                                        <Code className="size-8" />
                                        Technical Implementation
                                    </h2>
                                    <p className="text-white/70 text-base">
                                        Advanced technical details for developers.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {/* OAuth Flow */}
                                    <div className="bg-white/5 rounded-xl p-6">
                                        <h3 className="font-bold text-white mb-4 text-lg">OAuth Flow</h3>
                                        <div className="space-y-3 text-sm">
                                            {[
                                                "User enters credentials in modal",
                                                "System creates 'setup' record with encrypted credentials",
                                                "Generate OAuth URL with custom credentials",
                                                "Redirect to LinkedIn for authorization",
                                                "User authorizes on LinkedIn",
                                                "LinkedIn redirects back with authorization code",
                                                "Exchange code for access/refresh tokens",
                                                "Fetch profile data from LinkedIn",
                                                "Store encrypted tokens and update status to 'active'"
                                            ].map((step, i) => (
                                                <div key={i} className="flex items-center gap-3 text-white/70">
                                                    <div className="size-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                        {i + 1}
                                                    </div>
                                                    <span>{step}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* API Endpoints */}
                                    <div className="bg-white/5 rounded-xl p-6">
                                        <h3 className="font-bold text-white mb-4 text-lg">API Endpoints</h3>
                                        <div className="space-y-3">
                                            <div className="bg-black/30 rounded p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400">POST</span>
                                                    <code className="text-sm font-mono text-white">/api/oauth/linkedin/init</code>
                                                </div>
                                                <p className="text-xs text-white/60">Initiates LinkedIn OAuth flow with custom credentials</p>
                                            </div>
                                            <div className="bg-black/30 rounded p-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400">GET</span>
                                                    <code className="text-sm font-mono text-white">/api/oauth/callback</code>
                                                </div>
                                                <p className="text-xs text-white/60">Handles OAuth callback and token exchange</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Security Features */}
                                    <div className="bg-white/5 rounded-xl p-6">
                                        <h3 className="font-bold text-white mb-4 text-lg">Security Features</h3>
                                        <ul className="space-y-2 text-sm text-white/70">
                                            <li className="flex items-start gap-2">
                                                <Shield className="size-4 mt-0.5 text-green-400 shrink-0" />
                                                <span><strong className="text-white">AES-256-CBC encryption</strong> for all tokens and credentials</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Shield className="size-4 mt-0.5 text-green-400 shrink-0" />
                                                <span><strong className="text-white">CSRF protection</strong> using cryptographic state tokens</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Shield className="size-4 mt-0.5 text-green-400 shrink-0" />
                                                <span><strong className="text-white">HTTP-only cookies</strong> for state management</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <Shield className="size-4 mt-0.5 text-green-400 shrink-0" />
                                                <span><strong className="text-white">Multi-user isolation</strong> with user-specific encryption</span>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* Token Management */}
                                    <div className="bg-white/5 rounded-xl p-6">
                                        <h3 className="font-bold text-white mb-4 text-lg">Token Management</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-white/50 mb-1">Access Token Expiry</p>
                                                <p className="text-white font-mono">60 days</p>
                                            </div>
                                            <div>
                                                <p className="text-white/50 mb-1">Refresh Token Expiry</p>
                                                <p className="text-white font-mono">1 year</p>
                                            </div>
                                            <div>
                                                <p className="text-white/50 mb-1">Auto-Refresh</p>
                                                <p className="text-green-400">✓ Enabled</p>
                                            </div>
                                            <div>
                                                <p className="text-white/50 mb-1">Revocation Handling</p>
                                                <p className="text-green-400">✓ Email Notification</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Back to Top */}
                        <div className="mt-12 flex justify-center">
                            <Button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                variant="outline"
                                className="border-white/10 text-white hover:bg-white/5"
                            >
                                Back to Top
                            </Button>
                        </div>
                    </main>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-16">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center justify-between text-sm text-white/40">
                        <p>© 2026 SocialyNikara. All rights reserved.</p>
                        <p>Version 1.0.0 • Last Updated: February 6, 2026</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
