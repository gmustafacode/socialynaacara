"use client"

import React, { useState } from 'react'
import { X, Search, Book, Shield, Code, AlertCircle, CheckCircle, ChevronRight, ExternalLink } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Input } from './ui/input'
import { Button } from './ui/button'

interface LinkedInDocsModalProps {
    isOpen: boolean
    onClose: () => void
}

type DocSection = 'setup' | 'oauth' | 'credentials' | 'errors' | 'faq' | 'technical'

interface DocContent {
    id: DocSection
    title: string
    icon: React.ReactNode
    content: React.ReactNode
}

export function LinkedInDocsModal({ isOpen, onClose }: LinkedInDocsModalProps) {
    const [activeSection, setActiveSection] = useState<DocSection>('setup')
    const [searchQuery, setSearchQuery] = useState('')

    const sections: DocContent[] = [
        {
            id: 'setup',
            title: 'Setup Guide',
            icon: <Book className="size-4" />,
            content: <SetupGuideContent />
        },
        {
            id: 'oauth',
            title: 'OAuth & Scopes',
            icon: <Shield className="size-4" />,
            content: <OAuthScopesContent />
        },
        {
            id: 'credentials',
            title: 'Credentials',
            icon: <Code className="size-4" />,
            content: <CredentialsContent />
        },
        {
            id: 'errors',
            title: 'Troubleshooting',
            icon: <AlertCircle className="size-4" />,
            content: <TroubleshootingContent />
        },
        {
            id: 'faq',
            title: 'FAQ',
            icon: <CheckCircle className="size-4" />,
            content: <FAQContent />
        },
        {
            id: 'technical',
            title: 'Technical Docs',
            icon: <Code className="size-4" />,
            content: <TechnicalDocsContent />
        }
    ]

    const activeContent = sections.find(s => s.id === activeSection)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl h-[85vh] bg-neutral-950 border-white/10 text-white p-0 overflow-hidden">
                <div className="flex h-full">
                    {/* Sidebar Navigation */}
                    <div className="w-64 border-r border-white/10 bg-neutral-900/50 flex flex-col">
                        <DialogHeader className="p-6 border-b border-white/10">
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <Book className="size-5 text-blue-400" />
                                LinkedIn Docs
                            </DialogTitle>
                        </DialogHeader>

                        {/* Search */}
                        <div className="p-4 border-b border-white/10">
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
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {sections.map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeSection === section.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    {section.icon}
                                    <span className="text-sm font-medium">{section.title}</span>
                                    {activeSection === section.id && (
                                        <ChevronRight className="size-4 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </nav>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10">
                            <a
                                href="https://www.linkedin.com/developers/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                            >
                                <ExternalLink className="size-3" />
                                LinkedIn Developer Portal
                            </a>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col">
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                {activeContent?.icon}
                                {activeContent?.title}
                            </h2>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-white/60 hover:text-white"
                            >
                                <X className="size-5" />
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {activeContent?.content}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Content Components
function SetupGuideContent() {
    return (
        <div className="prose prose-invert max-w-none space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="size-5" />
                    Quick Start Guide
                </h3>
                <p className="text-white/70 text-sm mb-4">
                    Follow these steps to connect your LinkedIn account to SocialyNikara.
                </p>
            </div>

            <div className="space-y-6">
                <Step
                    number={1}
                    title="Create a LinkedIn App"
                    description="Go to the LinkedIn Developer Portal and create a new app."
                >
                    <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 ml-4">
                        <li>Visit <a href="https://www.linkedin.com/developers/apps" target="_blank" className="text-blue-400 underline">LinkedIn Developer Portal</a></li>
                        <li>Click <strong className="text-white">"Create app"</strong></li>
                        <li>Fill in app details (name, LinkedIn Page, logo)</li>
                        <li>Agree to terms and click <strong className="text-white">"Create app"</strong></li>
                    </ol>
                </Step>

                <Step
                    number={2}
                    title="Request Required Products"
                    description="Your app needs access to specific LinkedIn products."
                >
                    <div className="space-y-3">
                        <ProductCard
                            name="Share on LinkedIn"
                            tier="Default Tier"
                            description="Allows posting content to LinkedIn"
                            required
                        />
                        <ProductCard
                            name="Sign In with LinkedIn using OpenID Connect"
                            tier="Standard Tier"
                            description="Enables authentication and profile access"
                            required
                        />
                    </div>
                    <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-xs text-yellow-400">
                            ⚠️ <strong>Important:</strong> Wait until both products show "Approved" status before proceeding.
                        </p>
                    </div>
                </Step>

                <Step
                    number={3}
                    title="Configure OAuth Settings"
                    description="Set up authentication credentials and redirect URLs."
                >
                    <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 ml-4">
                        <li>Go to the <strong className="text-white">"Auth"</strong> tab in your app</li>
                        <li>Copy your <strong className="text-white">Client ID</strong></li>
                        <li>Generate and copy your <strong className="text-white">Client Secret</strong></li>
                        <li>Add redirect URL: <code className="bg-white/10 px-2 py-1 rounded text-blue-400">http://localhost:3000/api/oauth/callback</code></li>
                    </ol>
                </Step>

                <Step
                    number={4}
                    title="Connect in SocialyNikara"
                    description="Use your credentials to establish the connection."
                >
                    <ol className="list-decimal list-inside space-y-2 text-sm text-white/70 ml-4">
                        <li>Click the <strong className="text-white">"Connect LinkedIn"</strong> button</li>
                        <li>Enter your Client ID and Client Secret</li>
                        <li>Verify the redirect URI matches</li>
                        <li>Check the acknowledgment box</li>
                        <li>Click <strong className="text-white">"Initiate Handshake"</strong></li>
                        <li>Authorize on LinkedIn when prompted</li>
                    </ol>
                </Step>
            </div>
        </div>
    )
}

function OAuthScopesContent() {
    return (
        <div className="space-y-6">
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-400 mb-3">OAuth 2.0 Scopes</h3>
                <p className="text-white/70 text-sm">
                    Scopes define what your app can access on behalf of the user.
                </p>
            </div>

            <div className="space-y-4">
                <ScopeCard
                    scope="openid"
                    description="Required for OpenID Connect authentication"
                    required
                />
                <ScopeCard
                    scope="profile"
                    description="Access to basic profile information (name, photo)"
                    required
                />
                <ScopeCard
                    scope="email"
                    description="Access to primary email address"
                    required
                />
                <ScopeCard
                    scope="w_member_social"
                    description="Permission to create, modify, and delete posts"
                    required
                />
            </div>

            <div className="bg-white/5 rounded-xl p-6 space-y-4">
                <h4 className="font-bold text-white">How Scopes Work</h4>
                <ul className="space-y-2 text-sm text-white/70">
                    <li className="flex items-start gap-2">
                        <ChevronRight className="size-4 mt-0.5 text-blue-400 shrink-0" />
                        <span>Scopes are requested during the OAuth authorization flow</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <ChevronRight className="size-4 mt-0.5 text-blue-400 shrink-0" />
                        <span>Users see a consent screen showing what permissions you're requesting</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <ChevronRight className="size-4 mt-0.5 text-blue-400 shrink-0" />
                        <span>Your app can only access data covered by approved scopes</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <ChevronRight className="size-4 mt-0.5 text-blue-400 shrink-0" />
                        <span>Scopes are tied to the products approved for your LinkedIn app</span>
                    </li>
                </ul>
            </div>
        </div>
    )
}

function CredentialsContent() {
    return (
        <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-green-400 mb-3">Required Credentials</h3>
                <p className="text-white/70 text-sm">
                    You'll need these credentials from your LinkedIn app to establish a connection.
                </p>
            </div>

            <div className="space-y-4">
                <CredentialCard
                    name="Client ID"
                    description="Unique identifier for your LinkedIn app"
                    example="7764u9ak5vvmvq"
                    howToFind="Found in the 'Auth' tab of your LinkedIn app"
                />
                <CredentialCard
                    name="Client Secret"
                    description="Secret key for authenticating your app"
                    example="YOUR_CLIENT_SECRET"
                    howToFind="Generate in the 'Auth' tab - copy immediately as it's only shown once"
                    sensitive
                />
                <CredentialCard
                    name="Redirect URI"
                    description="URL where LinkedIn sends users after authorization"
                    example="http://localhost:3000/api/oauth/callback"
                    howToFind="Auto-filled in SocialyNikara - must match exactly in LinkedIn app settings"
                />
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                <h4 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                    <Shield className="size-5" />
                    Security Best Practices
                </h4>
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
        </div>
    )
}

function TroubleshootingContent() {
    return (
        <div className="space-y-6">
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-orange-400 mb-3">Common Issues & Solutions</h3>
                <p className="text-white/70 text-sm">
                    Quick fixes for the most common LinkedIn connection errors.
                </p>
            </div>

            <div className="space-y-4">
                <ErrorCard
                    error="unauthorized_scope_error"
                    cause="Requesting scopes that aren't approved for your app"
                    solution={[
                        "Go to LinkedIn Developer Portal → Your App → Products tab",
                        "Ensure 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect' are approved",
                        "Wait for approval if status shows 'Pending'",
                        "Try connecting again after approval"
                    ]}
                />
                <ErrorCard
                    error="redirect_uri_mismatch"
                    cause="The redirect URI doesn't match what's configured in your LinkedIn app"
                    solution={[
                        "Go to LinkedIn Developer Portal → Your App → Auth tab",
                        "Verify 'http://localhost:3000/api/oauth/callback' is in 'Authorized redirect URLs'",
                        "Check for trailing slashes (should NOT have one)",
                        "Ensure correct protocol (http for localhost, https for production)",
                        "Update and save if needed"
                    ]}
                />
                <ErrorCard
                    error="invalid_client_id / invalid_client_secret"
                    cause="Credentials don't match what's in your LinkedIn app"
                    solution={[
                        "Go to LinkedIn Developer Portal → Your App → Auth tab",
                        "Verify the Client ID matches exactly",
                        "If Client Secret is wrong, click 'Generate a new Client Secret'",
                        "Copy the new secret immediately",
                        "Try connecting again with correct credentials"
                    ]}
                />
                <ErrorCard
                    error="access_denied"
                    cause="User clicked 'Cancel' or app doesn't have required permissions"
                    solution={[
                        "Try the connection process again",
                        "Click 'Allow' when LinkedIn asks for permissions",
                        "Ensure your LinkedIn app has both required products approved",
                        "Check that you're logged into the correct LinkedIn account"
                    ]}
                />
                <ErrorCard
                    error="Connection shows 'Needs Re-authentication'"
                    cause="Access token has expired or been revoked"
                    solution={[
                        "Click the 'Re-authenticate' button on the LinkedIn card",
                        "You'll be redirected to LinkedIn to re-authorize",
                        "Click 'Allow' to grant permissions again",
                        "Connection will be restored"
                    ]}
                />
            </div>
        </div>
    )
}

function FAQContent() {
    return (
        <div className="space-y-6">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-cyan-400 mb-3">Frequently Asked Questions</h3>
                <p className="text-white/70 text-sm">
                    Answers to common questions about LinkedIn integration.
                </p>
            </div>

            <div className="space-y-4">
                <FAQItem
                    question="Do I need a LinkedIn Page to create an app?"
                    answer="Yes, LinkedIn requires you to associate your app with a LinkedIn Page. You can create a free LinkedIn Page if you don't have one."
                />
                <FAQItem
                    question="How long does product approval take?"
                    answer="For 'Share on LinkedIn' and 'Sign In with LinkedIn using OpenID Connect', approval is usually instant. However, it can take up to 24 hours in some cases."
                />
                <FAQItem
                    question="Can I connect multiple LinkedIn accounts?"
                    answer="Yes! Each account requires its own LinkedIn app. Simply create a new app for each account you want to connect, and follow the setup process for each one."
                />
                <FAQItem
                    question="How long do access tokens last?"
                    answer="LinkedIn access tokens expire after 60 days. SocialyNikara automatically refreshes your tokens before they expire, so you don't need to worry about re-authenticating."
                />
                <FAQItem
                    question="What happens if I regenerate my Client Secret?"
                    answer="If you regenerate your Client Secret in LinkedIn, you'll need to reconnect your account in SocialyNikara with the new secret. The old connection will stop working."
                />
                <FAQItem
                    question="Is my data secure?"
                    answer="Yes! SocialyNikara uses AES-256 encryption to store all your credentials and tokens. Your Client Secret and access tokens are never stored in plain text."
                />
                <FAQItem
                    question="Can I use this in production?"
                    answer="Yes! When deploying to production, update your redirect URI in both your LinkedIn app and SocialyNikara to use your production domain with HTTPS."
                />
            </div>
        </div>
    )
}

function TechnicalDocsContent() {
    return (
        <div className="space-y-6">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-6">
                <h3 className="text-lg font-bold text-indigo-400 mb-3">Technical Implementation</h3>
                <p className="text-white/70 text-sm">
                    Advanced technical details for developers.
                </p>
            </div>

            <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-4">OAuth Flow</h4>
                    <div className="space-y-3 text-sm">
                        <FlowStep step="1" text="User enters credentials in modal" />
                        <FlowStep step="2" text="System creates 'setup' record with encrypted credentials" />
                        <FlowStep step="3" text="Generate OAuth URL with custom credentials" />
                        <FlowStep step="4" text="Redirect to LinkedIn for authorization" />
                        <FlowStep step="5" text="User authorizes on LinkedIn" />
                        <FlowStep step="6" text="LinkedIn redirects back with authorization code" />
                        <FlowStep step="7" text="Exchange code for access/refresh tokens" />
                        <FlowStep step="8" text="Fetch profile data from LinkedIn" />
                        <FlowStep step="9" text="Store encrypted tokens and update status to 'active'" />
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-4">API Endpoints</h4>
                    <div className="space-y-3">
                        <ApiEndpoint
                            method="POST"
                            path="/api/oauth/linkedin/init"
                            description="Initiates LinkedIn OAuth flow with custom credentials"
                        />
                        <ApiEndpoint
                            method="GET"
                            path="/api/oauth/callback"
                            description="Handles OAuth callback and token exchange"
                        />
                    </div>
                </div>

                <div className="bg-white/5 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-4">Security Features</h4>
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

                <div className="bg-white/5 rounded-xl p-6">
                    <h4 className="font-bold text-white mb-4">Token Management</h4>
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
        </div>
    )
}

// Helper Components
function Step({ number, title, description, children }: { number: number; title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                    {number}
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-white mb-1">{title}</h4>
                    <p className="text-sm text-white/60 mb-4">{description}</p>
                    {children}
                </div>
            </div>
        </div>
    )
}

function ProductCard({ name, tier, description, required }: { name: string; tier: string; description: string; required?: boolean }) {
    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start justify-between mb-2">
                <h5 className="font-bold text-white">{name}</h5>
                {required && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Required</span>}
            </div>
            <p className="text-xs text-white/50 mb-2">{tier}</p>
            <p className="text-sm text-white/70">{description}</p>
        </div>
    )
}

function ScopeCard({ scope, description, required }: { scope: string; description: string; required?: boolean }) {
    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center justify-between mb-2">
                <code className="text-sm font-mono text-purple-400">{scope}</code>
                {required && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Required</span>}
            </div>
            <p className="text-sm text-white/70">{description}</p>
        </div>
    )
}

function CredentialCard({ name, description, example, howToFind, sensitive }: { name: string; description: string; example: string; howToFind: string; sensitive?: boolean }) {
    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start justify-between mb-2">
                <h5 className="font-bold text-white">{name}</h5>
                {sensitive && <Shield className="size-4 text-red-400" />}
            </div>
            <p className="text-sm text-white/70 mb-3">{description}</p>
            <div className="bg-black/30 rounded p-3 mb-3">
                <p className="text-xs text-white/50 mb-1">Example:</p>
                <code className="text-sm font-mono text-green-400">{example}</code>
            </div>
            <p className="text-xs text-white/50">
                <strong className="text-white">How to find:</strong> {howToFind}
            </p>
        </div>
    )
}

function ErrorCard({ error, cause, solution }: { error: string; cause: string; solution: string[] }) {
    return (
        <div className="bg-white/5 rounded-lg p-4 border border-red-500/20">
            <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                    <code className="text-sm font-mono text-red-400">{error}</code>
                    <p className="text-sm text-white/70 mt-1">{cause}</p>
                </div>
            </div>
            <div className="ml-8">
                <p className="text-xs font-bold text-white mb-2">Solution:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-white/70">
                    {solution.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
            </div>
        </div>
    )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    return (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <h5 className="font-bold text-white mb-2">{question}</h5>
            <p className="text-sm text-white/70">{answer}</p>
        </div>
    )
}

function FlowStep({ step, text }: { step: string; text: string }) {
    return (
        <div className="flex items-center gap-3 text-white/70">
            <div className="size-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">
                {step}
            </div>
            <span>{text}</span>
        </div>
    )
}

function ApiEndpoint({ method, path, description }: { method: string; path: string; description: string }) {
    return (
        <div className="bg-black/30 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${method === 'POST' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                    {method}
                </span>
                <code className="text-sm font-mono text-white">{path}</code>
            </div>
            <p className="text-xs text-white/60">{description}</p>
        </div>
    )
}
