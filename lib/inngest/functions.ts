import { inngest } from "./client";
import db from "../db";
import { LinkedInAuthService } from "../linkedin-auth-service";
import { LinkedInPostingService } from "../linkedin-posting-service";
import { checkPostingLimits } from "../limits";
import { getValidAccessToken } from "../oauth";
import { getBaseUrl } from "../utils";
import { AIService } from "../ai-service";

/**
 * Execution Engine: Publishes LinkedIn Article Posts (Feed + Groups)
 */
export const publishLinkedInPost = inngest.createFunction(
    {
        id: "publish-linkedin-post",
        retries: 3,
        onFailure: async ({ event, error, step }) => {
            const { postId, scheduledPostId } = event.data as any;
            console.error(`[Inngest] Critical failure for post ${postId || 'UNKNOWN'} after retries:`, error);

            if (postId) {
                await db.linkedInPost.update({
                    where: { id: postId },
                    data: {
                        status: 'FAILED',
                        errorMessage: error.message || "Unknown error (Retries exhausted)"
                    }
                }).catch(() => { });
            }

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

        if (!postId) {
            console.error("[Inngest] Missing postId in event data", event.data);
            return { error: "Missing postId" };
        }

        const post = await step.run("mark-processing", async () => {
            const result = await db.linkedInPost.updateMany({
                where: {
                    id: postId,
                    status: { in: ['SCHEDULED', 'PENDING', 'DRAFT'] },
                    linkedinPostUrn: null
                },
                data: { status: 'PROCESSING' }
            });

            if (result.count === 0) return null;

            return await db.linkedInPost.findUnique({
                where: { id: postId },
                include: { socialAccount: true }
            });
        });

        if (!post) {
            console.warn(`[Inngest] Skipping post ${postId} (Already processing or missing)`);
            return { skipped: true };
        }

        const result = await step.run("publish-via-service", async () => {
            return await LinkedInPostingService.publishPost(postId);
        });

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

/**
 * CRON SCHEDULER: Replaces automation-worker.ts for production (Vercel)
 * Runs every minute to find due posts and dispatch them.
 */
export const cronScheduler = inngest.createFunction(
    { id: "cron-scheduler", concurrency: 1 },
    { cron: "*/1 * * * *" },
    async ({ step }) => {
        const startedAt = new Date();

        // 1. Recover Stale Jobs
        await step.run("recover-stale-jobs", async () => {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            await db.scheduledPost.updateMany({
                where: {
                    status: 'processing',
                    updatedAt: { lte: thirtyMinutesAgo }
                },
                data: {
                    status: 'pending',
                    lastError: 'Stale post recovery: Reset after processing timeout.'
                }
            });
        });

        // 2. Fetch Due Posts
        const duePosts = await step.run("fetch-due-posts", async () => {
            const posts: any[] = await db.$queryRaw`
                SELECT id, "userId", platform, "content_id" as "contentId", "socialAccountId", "postType", "contentText" 
                FROM "scheduled_posts"
                WHERE status = 'pending'
                AND "scheduledAt" <= NOW()
                ORDER BY "scheduledAt" ASC
                LIMIT 100
                FOR UPDATE SKIP LOCKED;
            `;

            // Explicitly map lowercase fields if Postgres returned them as such
            return posts.map(p => ({
                ...p,
                contentId: p.contentId || p.contentid,
                userId: p.userId || p.userid,
                socialAccountId: p.socialAccountId || p.socialaccountid
            }));
        });


        if (duePosts.length === 0) return { message: "No posts due." };

        let publishedCount = 0;
        let failedCount = 0;

        // 3. Process Each Post
        const results = [];
        for (const post of duePosts) {
            const res = await step.run(`process-${post.id}`, async () => {
                try {
                    // 3.1 Rate Limit Check
                    const limitCheck = await checkPostingLimits(post.userId, post.platform);
                    if (!limitCheck.allowed) {
                        await db.scheduledPost.update({
                            where: { id: post.id },
                            data: {
                                status: 'pending',
                                scheduledAt: new Date(Date.now() + 5 * 60 * 1000), // Push back
                                lastError: `Rate Limit: ${limitCheck.error}`
                            }
                        });
                        return { id: post.id, status: "rate_limited" };
                    }

                    // 3.2 Mark Processing
                    await db.scheduledPost.update({
                        where: { id: post.id },
                        data: { status: 'processing', updatedAt: new Date() }
                    });

                    // 3.3 Dispatch Logic
                    if (post.platform === 'linkedin') {
                        await inngest.send({
                            name: "linkedin/post.publish",
                            data: { postId: post.contentId, scheduledPostId: post.id }
                        });
                        publishedCount++;
                        return { id: post.id, status: "dispatched_to_inngest" };
                    }

                    if (post.platform === 'rss' || post.platform === 'manual') {
                        const accessToken = await getValidAccessToken(post.socialAccountId);
                        const webhookUrl = process.env.N8N_PUBLISH_WEBHOOK_URL;
                        if (!webhookUrl) throw new Error("N8N Webhook Missing");

                        const resp = await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'x-webhook-secret': process.env.WEBHOOK_SECRET || '' },
                            body: JSON.stringify({
                                postId: post.id,
                                accessToken,
                                platform: post.platform,
                                contentText: post.contentText,
                                callbackUrl: `${getBaseUrl()}/api/posts/update-status`
                            }),
                            signal: AbortSignal.timeout(20000)
                        });

                        if (!resp.ok) throw new Error(`Webhook Error: ${resp.status}`);

                        await db.scheduledPost.update({
                            where: { id: post.id },
                            data: { status: 'published', publishedAt: new Date() }
                        });
                        publishedCount++;
                        return { id: post.id, status: "published_via_webhook" };
                    }

                    return { id: post.id, status: "unsupported_platform" };

                } catch (err: any) {
                    failedCount++;
                    await db.scheduledPost.update({
                        where: { id: post.id },
                        data: { status: 'failed', lastError: err.message, updatedAt: new Date() }
                    });
                    return { id: post.id, status: "failed", error: err.message };
                }
            });
            results.push(res);
        }

        // 4. Final Logging
        await step.run("log-execution", async () => {
            const finishedAt = new Date();
            await db.cronExecutionLog.create({
                data: {
                    startedAt,
                    finishedAt,
                    processed: duePosts.length,
                    published: publishedCount,
                    failed: failedCount,
                    executionTimeMs: finishedAt.getTime() - startedAt.getTime(),
                    errorsCount: failedCount
                }
            }).catch(() => { });
        });

        return { processed: duePosts.length, results };
    }
);

/**
 * AI CONTENT ANALYSIS: Scales Step 4 (Decision Layer)
 * Automatically processes pending items from the content queue.
 */
export const aiContentAnalysis = inngest.createFunction(
    {
        id: "ai-content-analysis",
        concurrency: 2 // Allow 2 batches in parallel
    },
    [
        { event: "ai/content.analyze" },
        { cron: "*/30 * * * *" } // Run every 30 minutes by default
    ],
    async ({ event, step }) => {
        const batchSize = event?.data?.batchSize || 10;

        const results = await step.run("process-ai-batch", async () => {
            return await AIService.processBatch(batchSize);
        });

        return {
            message: "AI Analysis Complete",
            stats: results
        };
    }
);

