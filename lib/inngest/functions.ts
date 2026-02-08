import { inngest } from "./client";
import db from "../db";
import { LinkedInAuthService } from "../linkedin-auth-service";
import { LinkedInPostingService } from "../linkedin-posting-service";

/**
 * Execution Engine: Publishes LinkedIn Article Posts (Feed + Groups)
 * Replicates Python logic 1-to-1: Fetch Me -> Build Payload -> Post to Feed -> Loop Post to Groups
 */
export const publishLinkedInPost = inngest.createFunction(
    {
        id: "publish-linkedin-post",
        retries: 3,
        onFailure: async ({ event, error, step }) => {
            const { postId } = event.data as any;
            console.error(`[Inngest] Critical failure for post ${postId} after retries:`, error);
            await db.linkedInPost.update({
                where: { id: postId },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message || "Unknown error (Retries exhausted)"
                }
            });
        }
    },
    { event: "linkedin/post.publish" },
    async ({ event, step }) => {
        const { postId } = event.data;

        // 1. Mark as Processing (Atomic check to prevent race conditions)
        const post = await step.run("mark-processing", async () => {
            // Use atomic updateMany with status filter - only ONE worker will succeed
            const result = await db.linkedInPost.updateMany({
                where: {
                    id: postId,
                    status: {
                        notIn: ['PROCESSING', 'PUBLISHED']
                    },
                    // Additional safety: Only process if no URN exists
                    linkedinPostUrn: null
                },
                data: { status: 'PROCESSING' }
            });

            // If count is 0, another worker already claimed it or it's already processed
            if (result.count === 0) {
                return null;
            }

            // Fetch the full post with relations
            const p = await db.linkedInPost.findUnique({
                where: { id: postId },
                include: { socialAccount: true }
            });

            return p;
        });

        if (!post) {
            console.warn(`[Inngest] Skipping post ${postId} (Already processing, published, or missing)`);
            return { skipped: true, reason: "already_processed_or_missing" };
        }

        // 2. Publish (Let errors bubble up for retry)
        const result = await step.run("publish-via-service", async () => {
            return await LinkedInPostingService.publishPost(postId);
        });

        return { success: true, ...result };
    }
);


/**
 * Scheduling Engine: Delays execution until the specified date
 */
export const scheduleLinkedInPost = inngest.createFunction(
    {
        id: "schedule-linkedin-post",
        onFailure: async ({ event, error }) => {
            const { postId } = event.data as any;
            console.error(`[Inngest] Scheduler failure for post ${postId}:`, error);
            await db.linkedInPost.update({
                where: { id: postId },
                data: { status: 'FAILED', errorMessage: `Scheduling failed: ${error.message}` }
            });
        }
    },
    { event: "linkedin/post.schedule" },
    async ({ event, step }) => {
        const { postId, scheduledAt } = event.data;

        if (!scheduledAt) throw new Error("Missing scheduledAt parameter");

        await step.sleepUntil("wait-period", new Date(scheduledAt));

        // Re-verify that the post still exists and is in SCHEDULED status before triggering publish
        const post = await step.run("verify-post-status", async () => {
            const p = await db.linkedInPost.findUnique({ where: { id: postId } });
            if (!p || (p.status !== 'SCHEDULED' && p.status !== 'PENDING')) {
                return null;
            }
            return p;
        });

        if (!post) {
            console.log(`[Inngest] Post ${postId} was cancelled, deleted, or already published while sleeping. Skipping.`);
            return { skipped: true, reason: "post_state_changed" };
        }

        await step.sendEvent("trigger-execution", {
            name: "linkedin/post.publish",
            data: { postId }
        });

        return { status: "scheduled_triggered" };
    }
);
