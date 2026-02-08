import { NextResponse } from 'next/server'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import db from "@/lib/db"
import { inngest } from "@/lib/inngest/client"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    const params = await context.params
    const id = params.id

    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const post = await db.linkedInPost.findUnique({
            where: { id, userId: (session.user as any).id },
            include: { socialAccount: true }
        })

        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 })
        }

        // Reset status to DRAFT or PENDING
        await db.linkedInPost.update({
            where: { id },
            data: {
                status: post.scheduledAt ? 'SCHEDULED' : 'PENDING',
                errorMessage: null
            }
        })

        // Trigger Inngest
        await inngest.send({
            name: "linkedin/post.publish",
            data: {
                postId: post.id,
            }
        })

        return NextResponse.json({ success: true, message: "Retry initiated" })
    } catch (error) {
        console.error("Failed to retry post:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}