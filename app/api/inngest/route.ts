import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { publishLinkedInPost, cronScheduler, aiContentAnalysis, aiFeedbackLoop } from "@/lib/inngest/functions";
import { scheduledContentIngestion } from "@/lib/inngest/ingestion";

export const maxDuration = 300; // Allow functions up to 5 mins on Vercel
export const dynamic = 'force-dynamic';

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        publishLinkedInPost,
        scheduledContentIngestion,
        cronScheduler,
        aiContentAnalysis,
        aiFeedbackLoop
    ],
});
