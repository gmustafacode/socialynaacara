
import 'dotenv/config';
import db from './lib/db';
import cron from 'node-cron';
import { LinkedInPostingService } from './lib/linkedin-posting-service';
import { getValidAccessToken } from './lib/oauth';
import { getBaseUrl } from './lib/utils';

/**
 * SOCIALSYNCARA BACKEND CRON WORKER (v3 - Database Driven)
 * 
 * Objectives:
 * 1. Process scheduled posts from DB.
 * 2. Distributed safety via SELECT FOR UPDATE SKIP LOCKED.
 * 3. Support retries with exponential-ish logic (simple count for now).
 * 4. Comprehensive execution logging.
 */

let isRunning = false;

/**
 * Resets jobs that have been stuck in 'processing' for too long.
 */
async function recoverStaleJobs() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const stuckPosts = await db.scheduledPost.updateMany({
        where: {
            status: 'processing',
            updatedAt: { lte: thirtyMinutesAgo }
        },
        data: {
            status: 'pending',
            lastError: 'Stale post recovery: Reset after processing timeout.'
        }
    });

    if (stuckPosts.count > 0) {
        console.log(`[WORKER] Recovered ${stuckPosts.count} stale scheduled posts.`);
    }
}

async function checkAndProcess() {
    if (isRunning) {
        console.log("[WORKER] Previous cycle still in progress. Skipping.");
        return;
    }

    isRunning = true;
    const startedAt = new Date();
    console.log(`[WORKER] [${startedAt.toISOString()}] Starting cron cycle...`);

    let processedCount = 0;
    let publishedCount = 0;
    let failedCount = 0;
    let errorsCount = 0;

    try {
        await recoverStaleJobs();

        // 1. Fetch due posts with Row Locking (PostgreSQL specific)
        // SKIP LOCKED ensures horizontal scalability without double-processing
        const duePostIds: { id: string }[] = await db.$queryRaw`
            SELECT id FROM "scheduled_posts"
            WHERE status = 'pending'
            AND "scheduledAt" <= NOW()
            ORDER BY "scheduledAt" ASC
            LIMIT 50
            FOR UPDATE SKIP LOCKED;
        `;

        if (duePostIds.length === 0) {
            isRunning = false; // Early exit
            return;
        }

        processedCount = duePostIds.length;
        console.log(`[WORKER] Found ${processedCount} posts to process.`);

        for (const { id } of duePostIds) {
            try {
                // 2. Claim and Start Processing
                const post = await db.scheduledPost.update({
                    where: { id },
                    data: {
                        status: 'processing',
                        updatedAt: new Date()
                    },
                    include: { socialAccount: true }
                });

                console.log(`[WORKER] Processing ${post.platform} post: ${id}`);

                // 3. Worker Logic: Prepare and Prepare for Publish
                const driftMs = Date.now() - post.scheduledAt.getTime();
                console.log(`[WORKER] Processing ${post.platform} post: ${id} (Drift: ${driftMs}ms)`);

                let result: any = null;

                if (post.platform === 'linkedin') {
                    if (!post.contentId) throw new Error("LinkedIn post missing contentId");

                    // Trigger Existing Worker Logic (The Ingestion Layer)
                    result = await LinkedInPostingService.publishPost(post.contentId);

                    if (result.status === 'PUBLISHED' || result.status === 'PARTIAL_SUCCESS') {
                        // Success path
                        await db.scheduledPost.update({
                            where: { id },
                            data: {
                                status: 'published',
                                publishedAt: new Date(),
                                externalPostId: result.results?.[0] || null,
                                updatedAt: new Date()
                            }
                        });

                        // Ensure LinkedInPost table is also marked published
                        await db.linkedInPost.update({
                            where: { id: post.contentId },
                            data: { status: 'PUBLISHED' }
                        }).catch(() => { });

                        publishedCount++;
                        console.log(`[WORKER] Successfully published LinkedIn post: ${id}`);
                    } else {
                        throw new Error(result.errors?.join(' | ') || "LinkedIn publishing failed with unknown error");
                    }
                } else if (post.platform === 'rss' || post.platform === 'manual') {
                    // ContentQueue based posts
                    const accessToken = await getValidAccessToken(post.socialAccountId);
                    const webhookUrl = process.env.N8N_PUBLISH_WEBHOOK_URL;

                    if (!webhookUrl) throw new Error("N8N_PUBLISH_WEBHOOK_URL not configured");

                    const response = await fetch(webhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
                        },
                        body: JSON.stringify({
                            postId: post.id,
                            accessToken,
                            platform: post.platform,
                            postType: post.postType,
                            contentText: post.contentText,
                            callbackUrl: `${getBaseUrl()}/api/posts/update-status`
                        }),
                        signal: AbortSignal.timeout(30000)
                    });

                    if (!response.ok) throw new Error(`Webhook Failed: ${response.status}`);

                    // ContentQueue status update
                    if (post.contentId) {
                        await db.contentQueue.update({
                            where: { id: post.contentId },
                            data: { status: 'published', publishedAt: new Date() }
                        }).catch(() => { });
                    }

                    await db.scheduledPost.update({
                        where: { id },
                        data: {
                            status: 'published',
                            publishedAt: new Date(),
                            updatedAt: new Date()
                        }
                    });
                    publishedCount++;
                } else {
                    // Default fallback for other platforms
                    const accessToken = await getValidAccessToken(post.socialAccountId);
                    const webhookUrl = process.env.N8N_PUBLISH_WEBHOOK_URL;
                    if (webhookUrl && accessToken) {
                        await fetch(webhookUrl, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ postId: post.id, accessToken })
                        });
                    }

                    await db.scheduledPost.update({
                        where: { id },
                        data: {
                            status: 'published',
                            publishedAt: new Date(),
                            updatedAt: new Date()
                        }
                    });
                    publishedCount++;
                }


            } catch (postError: any) {
                console.error(`[WORKER] Error processing post ${id}:`, postError.message);
                failedCount++;
                errorsCount++;

                const currentPost = await db.scheduledPost.findUnique({ where: { id } });
                const retryCount = (currentPost?.retryCount || 0) + 1;
                const setStatus = retryCount < 3 ? 'pending' : 'failed';

                await db.scheduledPost.update({
                    where: { id },
                    data: {
                        status: setStatus,
                        retryCount: retryCount,
                        lastError: postError.message,
                        updatedAt: new Date()
                    }
                });
            }
        }
    } catch (globalError: any) {
        console.error("[WORKER] [CRITICAL] Global execution error:", globalError.message);
    } finally {
        const finishedAt = new Date();
        const executionTimeMs = finishedAt.getTime() - startedAt.getTime();

        // 4. Log execution summary
        try {
            await db.cronExecutionLog.create({
                data: {
                    startedAt,
                    finishedAt,
                    processed: processedCount,
                    published: publishedCount,
                    failed: failedCount,
                    executionTimeMs,
                    errorsCount
                }
            });
        } catch (logError) {
            console.error("[WORKER] Failed to save execution log:", logError);
        }

        isRunning = false;
        console.log(`[WORKER] Cycle complete. Processed: ${processedCount}, Success: ${publishedCount}, Failed: ${failedCount}`);
    }
}

// Start Scheduler
console.log("[WORKER] SocialSyncAra Backend Scheduler Active (Running Every Minute)");
cron.schedule('* * * * *', checkAndProcess);

// Handle process signals for graceful shutdown
process.on('SIGTERM', () => {
    console.log("[WORKER] SIGTERM received. Closing...");
    process.exit(0);
});

// Run immediately on startup
checkAndProcess();
