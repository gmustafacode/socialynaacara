import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    try {
        const body = await request.json();
        const { accountId, platform, contentType, contentData, scheduledFor } = body;

        // 1. Ownership Verification: Ensure the user owns the social account
        const account = await db.socialAccount.findFirst({
            where: {
                id: accountId,
                userId: userId,
                status: "active"
            }
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid or unauthorized account" }, { status: 403 });
        }

        const isScheduled = !!scheduledFor;
        const scheduleTime = isScheduled ? new Date(scheduledFor) : new Date();

        // 2. Create the primary SocialSync record (LinkedInPost)
        // We use this table for historical tracking and LinkedIn-specific data
        const liPost = await db.linkedInPost.create({
            data: {
                user: { connect: { id: userId } },
                socialAccount: { connect: { id: accountId } },
                description: contentData.description || contentData.title || "",
                title: contentData.title || null,
                postType: contentType || "ARTICLE",
                mediaUrls: contentData.thumbnailUrl ? [contentData.thumbnailUrl] : [],
                status: isScheduled ? 'SCHEDULED' : 'PENDING',
                targetType: 'FEED',
                visibility: 'PUBLIC'
            }
        });

        // 3. Create the Queue/Worker pointer (ScheduledPost)
        const scheduledPost = await db.scheduledPost.create({
            data: {
                userId,
                socialAccountId: accountId,
                platform: account.platform,
                postType: contentType || "ARTICLE",
                contentText: contentData.description || contentData.title || "",
                mediaUrl: contentData.thumbnailUrl || null,
                targetType: "FEED",
                scheduledAt: scheduleTime,
                status: isScheduled ? "pending" : "processing",
                contentId: liPost.id // Link to the tracking table
            }
        });

        // 4. IMMEDIATE TRIGGER: If not scheduled, bypass the worker and send to Inngest engine NOW
        let inngestResult = null;
        if (!isScheduled) {
            console.log(`[API] Instant publish detected. Dispatching LinkedIn post ${liPost.id} to Inngest engine...`);
            inngestResult = await inngest.send({
                name: "linkedin/post.publish",
                data: {
                    postId: liPost.id,
                    scheduledPostId: scheduledPost.id
                }
            });
        }

        return NextResponse.json({
            success: true,
            message: isScheduled ? "Post scheduled successfully" : "Post dispatched for immediate publishing",
            scheduled_at_utc: scheduleTime.toISOString(),
            postId: liPost.id,
            inngestEvent: inngestResult?.ids?.[0] || null
        });

    } catch (error) {
        console.error("Posting/Scheduling error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
