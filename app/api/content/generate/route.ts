import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { AIService } from "@/lib/ai-service";
import { GenerateContentSchema } from "@/lib/validations/api";
import { ZodError } from "zod";

export async function POST(req: NextRequest) {
    try {
        // 1. Authentication Check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = (session.user as any).id;

        // 2. Input Validation (Zod)
        const json = await req.json();
        const body = GenerateContentSchema.parse(json);

        // 3. AIService Execution
        console.log(`[Content Generate API] Starting for User ${userId}, Topic: ${body.topic}`);
        const intelligenceResult = await AIService.runIntelligenceLayer(
            userId,
            body.topic,
            body.audience,
            body.tone
        );

        if (!intelligenceResult) {
            return NextResponse.json({ error: "Failed to generate intelligent content" }, { status: 500 });
        }

        // 4. Response Mapping
        return NextResponse.json({
            content: intelligenceResult.rawContent,
            platformContent: intelligenceResult.platformContent,
            safety: intelligenceResult.safetyStatus,
            analytics: intelligenceResult.analytics,
            feedback: intelligenceResult.feedbackPrompt
        });

    } catch (error: any) {
        if (error instanceof ZodError) {
            return NextResponse.json({
                error: "Validation failed",
                details: error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`)
            }, { status: 400 });
        }

        console.error("[Content Generate API] CRITICAL Error:", error);
        return NextResponse.json(
            { error: "Internal server error", message: process.env.NODE_ENV === 'development' ? error.message : undefined },
            { status: 500 }
        );
    }
}
