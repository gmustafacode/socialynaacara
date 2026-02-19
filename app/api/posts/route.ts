
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getValidAccessToken } from "@/lib/oauth";
import { getBaseUrl } from "@/lib/utils";

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

        if (!socialAccountId || !postType || !contentText || !targetType) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify social account ownership
        const account = await db.socialAccount.findUnique({
            where: { id: socialAccountId },
        });

        if (!account || account.userId !== (session.user as any).id) {
            return new NextResponse("Invalid social account", { status: 403 });
        }

        const status = scheduledAt ? "SCHEDULED" : "DRAFT"; // Initial status. If "Publish Now", frontend calls publish endpoint after cleanup, or we handle it here.
        // User flow: "Publish Now" -> changes status to PUBLISHED (pending) -> triggers n8n.
        // "Schedule for Later" -> changes status to SCHEDULED.

        // If scheduledAt is provided, it's SCHEDULED.
        // If user clicked "Publish Now", scheduledAt is null.
        // Ideally, we create it as DRAFT or SCHEDULED, then if "Publish Now", we trigger immediately.
        // The spec says: "If scheduled -> mark as SCHEDULED. If publish now -> send payload to n8n webhook".

        // Check if "Publish Now" is intended. The body might flag it, or just lack scheduledAt? 
        // Usually "Publish Now" means scheduledAt is null (or immediate).
        // But we also support "Save as Draft". 
        // Let's add an explicit `action` field in the body or infer from context? 
        // "status" in body is safer.

        let initialStatus = body.status || (scheduledAt ? "SCHEDULED" : "DRAFT");

        const post = await db.scheduledPost.create({
            data: {
                userId: (session.user as any).id,
                socialAccountId,
                platform: account.platform.toUpperCase(),
                postType,
                contentText,
                mediaUrl,
                targetType,
                targetId,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                status: initialStatus,
            },
        });

        // If "Publish Now", trigger n8n immediately
        if (initialStatus === "PUBLISHED" || (body.publishNow === true)) { // Handle specific flag
            // Re-update status to allow the process to start properly
            // Actually, if we want to publish now, we should trigger the n8n endpoint.
            // Internal call to the logic.

            // We can return the post and let the frontend call /api/n8n/publish to decouple.
            // OR we do it here. Doing it here is faster UX.

            const accessToken = await getValidAccessToken(socialAccountId);
            if (!accessToken) {
                return NextResponse.json({ error: "Failed to get access token", post }, { status: 400 });
            }

            if (process.env.N8N_PUBLISH_WEBHOOK_URL) {
                // Non-blocking fetch? Or blocking? User probably wants confirmation.
                // We'll fire and forget or wait?
                // Spec says "If publish now -> send payload to n8n webhook".

                try {
                    await fetch(process.env.N8N_PUBLISH_WEBHOOK_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
                        },
                        body: JSON.stringify({
                            postId: post.id,
                            accessToken,
                            postType: post.postType,
                            contentText: post.contentText,
                            mediaUrl: post.mediaUrl,
                            targetType: post.targetType,
                            targetId: post.targetId,
                            authorUrn: account.platformAccountId, // Added authorUrn
                            callbackUrl: `${getBaseUrl()}/api/posts/update-status`
                        }),
                        signal: AbortSignal.timeout(10000)
                    });
                } catch (e) {
                    console.error("Failed to trigger n8n webhook", e);
                }
            }
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error("POST /api/posts Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
