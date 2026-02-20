import { inngest } from "./client";
import db from "../db";
import { LinkedInAuthService } from "../linkedin-auth-service";
import { LinkedInPostingService } from "../linkedin-posting-service";

// /**
//  * Execution Engine: Publishes LinkedIn Article Posts (Feed + Groups)
//  * Replicates Python logic 1-to-1: Fetch Me -> Build Payload -> Post to Feed -> Loop Post to Groups
//  */
export const publishLinkedInPost = inngest.createFunction(
    {
        id: "publish-linkedin-post",
        retries: 3,
        onFailure: async ({ event, error, step }) => {
            const { postId, scheduledPostId } = event.data as any;
            console.error(`[Inngest] Critical failure for post ${postId} after retries:`, error);

            // 1. Update LinkedInPost
            await db.linkedInPost.update({
                where: { id: postId },
                data: {
                    status: 'FAILED',
                    errorMessage: error.message || "Unknown error (Retries exhausted)"
                }
            });

            // 2. Update ScheduledPost if applicable
            if (scheduledPostId) {
                await db.scheduledPost.update({
                    where: { id: scheduledPostId },
                    data: {
                        status: 'failed',
                        lastError: error.message || "Unknown error (Retries exhausted)"
                    }
                }).catch(() => { });
            }
        }
    },
    { event: "linkedin/post.publish" },
    async ({ event, step }) => {
        const { postId, scheduledPostId } = event.data;

        // 1. Mark as Processing (Atomic check to prevent race conditions)
        const post = await step.run("mark-processing", async () => {
            // Use atomic updateMany with status filter - only ONE worker will succeed
            const result = await db.linkedInPost.updateMany({
                where: {
                    id: postId,
                    status: {
                        in: ['SCHEDULED', 'PENDING', 'DRAFT'] // Allow DRAFT if manually triggered, PENDING if from worker
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

        // 3. Post-Publish Sync (Success)
        if (scheduledPostId) {
            await step.run("sync-scheduled-post", async () => {
                const r = result as any;
                const externalId = r.results?.[0] || null;
                await db.scheduledPost.update({
                    where: { id: scheduledPostId },
                    data: {
                        status: 'published',
                        publishedAt: new Date(),
                        externalPostId: externalId
                    }
                });
                console.log(`[Inngest] Synced ScheduledPost ${scheduledPostId} status to published.`);
            });
        }

        return { success: true, ...result };
    }
);


/**
 * DEPRECATED: Scheduler Engine
 * As of v3, scheduling is handled by the backend cron (automation-worker.ts)
 * and the ScheduledPost table. This function is kept momentarily for 
 * inflight jobs but should not be triggered by new API calls.
 */
/*
export const scheduleLinkedInPost = inngest.createFunction(
    {
        id: "schedule-linkedin-post",
        ... (commented out code)
    }
);
*/



/**
 * Test function to verify Inngest setup
 */
export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { message: `Hello ${event.data.email || 'World'}!` };
    },
);