
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

        // 4. Create ScheduledPost record (New Backend-Driven Scheduling)
        const scheduleTime = scheduledFor ? new Date(scheduledFor) : new Date();

        await db.scheduledPost.create({
            data: {
                userId,
                socialAccountId: accountId,
                platform: platform || account.platform,
                postType: contentType || "ARTICLE",
                contentText: contentData.description || contentData.title || "",
                mediaUrl: contentData.thumbnailUrl || null,
                targetType: "FEED",
                scheduledAt: scheduleTime,
                timezone: body.timezone || "UTC",
                status: "pending",
                contentId: queuedItem.id // Link to the content record
            }
        });

        return NextResponse.json({
            success: true,
            message: "Post scheduled successfully",
            scheduled_at_utc: scheduleTime.toISOString(),
            itemId: queuedItem.id
        });


    } catch (error) {
        console.error("Scheduling error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
