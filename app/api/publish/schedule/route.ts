
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

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

        // 2. Queue the content
        const queuedItem = await db.contentQueue.create({
            data: {
                userId,
                source: platform || "MANUAL",
                contentType: contentType || "ARTICLE",
                title: contentData.title || null,
                summary: contentData.description || null,
                rawContent: JSON.stringify(contentData),
                mediaUrl: contentData.thumbnailUrl || null,
                sourceUrl: contentData.youtubeUrl || null,
                status: "pending",
                scheduledAt: scheduledFor ? new Date(scheduledFor) : null,
            }
        });

        // 3. Log the history (scheduled)
        await db.postHistory.create({
            data: {
                userId,
                platform: account.platform,
                contentId: queuedItem.id,
                status: "scheduled",
                postedAt: scheduledFor ? new Date(scheduledFor) : new Date()
            }
        });

        // 4. Trigger Inngest Workflow
        const { inngest } = await import('@/lib/inngest/client');

        if (scheduledFor) {
            await inngest.send({
                name: 'linkedin/post.schedule',
                data: {
                    postId: queuedItem.id, // Note: This assumes we are creating a LinkedInPost record as well, or we should use ContentQueue ID
                    scheduledAt: new Date(scheduledFor).toISOString()
                }
            });
        } else {
            // Immediate publish if no schedule date
            await inngest.send({
                name: 'linkedin/post.publish',
                data: { postId: queuedItem.id }
            });
        }

        return NextResponse.json({ success: true, itemId: queuedItem.id });

    } catch (error) {
        console.error("Scheduling error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
