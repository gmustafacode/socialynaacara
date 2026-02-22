import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params
    const id = params.id

    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const userId = (session.user as any).id

        // Find the ScheduledPost and verify ownership
        const post = await db.scheduledPost.findFirst({
            where: { id, userId }
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        if (post.status === 'PUBLISHED' || post.status === 'published') {
            return NextResponse.json({ error: "Post is already published" }, { status: 400 })
        }

        if (post.status === 'CANCELLED' || post.status === 'cancelled') {
            return NextResponse.json({ error: "Cancelled posts cannot be retried. Please create a new post." }, { status: 400 })
        }

        // Reset the ScheduledPost to pending so the scheduler picks it up immediately
        await db.scheduledPost.update({
            where: { id },
            data: {
                status: 'pending',
                scheduledAt: new Date(), // Process immediately
                retryCount: 0,          // Reset retry counter
                lastError: null,
                updatedAt: new Date()
            }
        })

        return NextResponse.json({ success: true, message: "Post queued for retry. It will be processed within 1 minute." })
    } catch (error) {
        console.error("Failed to retry scheduled post:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
