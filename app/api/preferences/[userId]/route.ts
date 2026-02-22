import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
    // Await the params promise
    const params = await context.params
    const userId = params.userId

    // Check auth
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).id !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const preferences = await db.preference.findUnique({
            where: { userId }
        })
        return NextResponse.json(preferences || {})
    } catch (e) {
        return NextResponse.json({ error: "Error fetching preferences" }, { status: 500 })
    }
}

export async function PUT(request: Request, context: { params: Promise<{ userId: string }> }) {
    const params = await context.params
    const userId = params.userId
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).id !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const {
            preferredContentTypes,
            postingSchedule,
            notificationsEnabled,
            brandName,
            profileType,
            audienceType,
            industryNiche,
            contentGoals,
            preferredPlatforms,
            postingFrequency,
            automationLevel,
            preferredPostingTimes,
            onboardingCompleted,
            timezone
        } = body

        const updated = await db.preference.upsert({
            where: { userId },
            update: {
                preferredContentTypes: preferredContentTypes,
                postingSchedule: postingSchedule ? (typeof postingSchedule === 'string' ? JSON.parse(postingSchedule) : postingSchedule) : undefined,
                notificationsEnabled,
                brandName,
                profileType,
                audienceType,
                industryNiche,
                contentGoals,
                preferredPlatforms,
                postingFrequency,
                automationLevel,
                onboardingCompleted,
                timezone
            },
            create: {
                userId,
                preferredContentTypes: preferredContentTypes || [],
                postingSchedule: postingSchedule ? (typeof postingSchedule === 'string' ? JSON.parse(postingSchedule) : postingSchedule) : {},
                notificationsEnabled: notificationsEnabled ?? true,
                brandName,
                profileType,
                audienceType,
                industryNiche,
                contentGoals,
                preferredPlatforms: preferredPlatforms || [],
                postingFrequency,
                automationLevel,
                onboardingCompleted: onboardingCompleted ?? false,
                timezone
            }
        })

        return NextResponse.json(updated)
    } catch (e) {
        console.error("Error updating preferences:", e)
        return NextResponse.json({ error: "Error updating preferences" }, { status: 500 })
    }
}

