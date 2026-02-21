import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { content, platforms } = body;

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const moderationResult = await AIService.moderateAndOptimize(
            content,
            platforms || ["General"]
        );

        return NextResponse.json(moderationResult);

    } catch (error: any) {
        console.error("[Content Moderate API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
