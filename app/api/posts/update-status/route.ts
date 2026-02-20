
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

        // 2. Validate and Normalize Status
        const validStatuses = ["pending", "processing", "published", "failed", "cancelled"];

        let normalizedStatus = status.toLowerCase();
        if (status === "PUBLISHED") normalizedStatus = "published";
        if (status === "FAILED") normalizedStatus = "failed";
        if (status === "SCHEDULED") normalizedStatus = "pending";

        if (!validStatuses.includes(normalizedStatus)) {
            return new NextResponse(`Invalid status: ${status}`, { status: 400 });
        }

        // 3. Update Record
        await db.scheduledPost.update({
            where: { id: postId },
            data: {
                status: normalizedStatus,
                externalPostId: externalPostId || undefined,
                lastError: error || undefined,
                updatedAt: new Date(),
            }
        });


        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("POST /api/posts/update-status Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
