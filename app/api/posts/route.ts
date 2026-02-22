
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth";
import { getBaseUrl } from "@/lib/utils";
import { SchedulerService } from "@/lib/scheduler-service";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const whereClause: any = { userId: (session.user as any).id };
        if (status) {
            whereClause.status = status.toUpperCase();
        }

        const posts = await db.scheduledPost.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                socialAccount: {
                    select: {
                        platform: true,
                        metadata: true, // To get account name/handle
                    },
                },
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("GET /api/posts Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const {
            socialAccountId,
            postType,
            contentText,
            mediaUrl,
            targetType,
            targetId,
            scheduledAt,
        } = body;

        // Fetch account to get platform
        const account = await db.socialAccount.findUnique({ where: { id: socialAccountId } });
        if (!account) return new NextResponse("Invalid social account", { status: 403 });

        // Call Unified Scheduler Service
        const result = await SchedulerService.schedulePost({
            userId: (session.user as any).id,
            accountId: socialAccountId,
            platform: account.platform,
            contentType: postType,
            contentData: {
                description: contentText,
                mediaUrl: mediaUrl
            },
            scheduledFor: scheduledAt ? new Date(scheduledAt) : null,
            targetType: targetType,
            targetId: targetId
        });

        // Return the created Master Scheduler record to maintain UI expectations
        const post = await db.scheduledPost.findUnique({
            where: { id: result.scheduledPostId },
            include: { socialAccount: { select: { platform: true, metadata: true } } }
        });

        return NextResponse.json(post);
    } catch (error: any) {
        console.error("POST /api/posts Error:", error);
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
