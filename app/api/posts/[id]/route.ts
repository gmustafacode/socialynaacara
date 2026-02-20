import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params
    const id = params.id

    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id

    try {
        // Find the scheduled post and verify ownership
        const post = await db.scheduledPost.findFirst({
            where: { id, userId }
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // Only allow cancellation of pending/scheduled posts
        if (!['pending', 'PENDING', 'SCHEDULED', 'scheduled'].includes(post.status)) {
            return NextResponse.json({
                error: `Cannot cancel a post with status "${post.status}". Only pending or scheduled posts can be cancelled.`
            }, { status: 400 })
        }

        // Update the scheduled post status  
        await db.scheduledPost.update({
            where: { id },
            data: {
                status: 'CANCELLED',
                updatedAt: new Date()
            }
        })

        // Also update the linked content record if it exists
        if (post.contentId) {
            // Try LinkedInPost first
            try {
                await db.linkedInPost.update({
                    where: { id: post.contentId },
                    data: { status: 'CANCELLED' }
                })
            } catch {
                // May not be a LinkedInPost, try ContentQueue
                try {
                    await db.contentQueue.update({
                        where: { id: post.contentId },
                        data: { status: 'cancelled' }
                    })
                } catch {
                    // Content record may have been deleted or doesn't exist
                }
            }
        }

        return NextResponse.json({ success: true, message: "Post cancelled successfully" })
    } catch (error) {
        console.error("Cancel post error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
