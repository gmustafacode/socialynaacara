
import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function POST(req: Request) {
    try {
        // 1. Security Check: Verify secret if defined
        const secret = req.headers.get('x-webhook-secret');
        if (process.env.WEBHOOK_SECRET && secret !== process.env.WEBHOOK_SECRET) {
            console.warn("[Security] Unauthorized attempt to update post status from", req.headers.get('x-forwarded-for') || 'unknown');
            return new NextResponse("Unauthorized secret mismatch", { status: 401 });
        }

        const body = await req.json();
        const { postId, status, externalPostId, error } = body;

        if (!postId || !status) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        // Validate status enum
        const validStatuses = ["DRAFT", "SCHEDULED", "PUBLISHED", "FAILED"];
        if (!validStatuses.includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        await db.scheduledPost.update({
            where: { id: postId },
            data: {
                status,
                externalPostId: externalPostId || undefined,
                updatedAt: new Date(),
                // Optionally log error in a separate field if we added one, or just in status
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/posts/update-status Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
