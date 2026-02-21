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

        const userId = (session.user as any).id;
        const body = await req.json();
        const { topic, audience, tone } = body;

        if (!topic || typeof topic !== 'string') {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const generatedContent = await AIService.generateContent(
            userId,
            topic,
            audience || "General Public",
            tone || "Professional"
        );

        if (!generatedContent) {
            return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
        }

        return NextResponse.json({ content: generatedContent });

    } catch (error: any) {
        console.error("[Content Generate API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
