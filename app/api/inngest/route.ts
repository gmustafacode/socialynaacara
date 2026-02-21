import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { publishLinkedInPost, helloWorld, cronScheduler, aiContentAnalysis, aiFeedbackLoop } from "@/lib/inngest/functions";
import { scheduledContentIngestion } from "@/lib/inngest/ingestion";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        publishLinkedInPost,
        helloWorld,
        scheduledContentIngestion,
        cronScheduler,
        aiContentAnalysis,
        aiFeedbackLoop
    ],
});