
import 'dotenv/config';
import db from './lib/db';
import cron from 'node-cron';
import { inngest } from './lib/inngest/client';
import { getValidAccessToken } from './lib/oauth';
import { getBaseUrl } from './lib/utils';

/**
 * SOCIALSYNCARA SYSTEM WORKER (HARDENED v2)
 * 
 * Performance & Reliability Updates:
 * 1. Stale Job Recovery: Automatically resets jobs stuck in 'PROCESSING' or 'PENDING'.
 * 2. Proper Status Flow: Uses 'PROCESSING' during execution instead of premature 'PUBLISHED'.
 * 3. Enhanced DB Resilience: More robust retry logic and connection handling.
 * 4. Improved Logging: Detailed error reporting for debugging.
 */

let isRunning = false;

// Simple database wrapper with retry logic for resilience against connection drops
async function dbRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const msg = error.message || "";
            if (msg.includes('Server has closed the connection') ||
                msg.includes('connection') ||
                msg.includes('timeout') ||
                msg.includes('Pool')) {
                console.warn(`[WORKER] DB Connection Error (Attempt ${i + 1}/${retries}). Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

/**
 * Resets jobs that have been stuck in an intermediate state for too long.
 * Prevents "Silent Failures" and "Ghost Processing".
 */
async function recoverStaleJobs() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // 1. Recover LinkedIn Posts
    const stuckLinkedIn = await db.linkedInPost.updateMany({
        where: {
            status: { in: ['PROCESSING', 'PENDING'] },
            updatedAt: { lte: tenMinutesAgo }
        },
        data: {
            status: 'SCHEDULED', // Push back to queue
            errorMessage: 'Stale post recovery: Reset after timeout.'
        }
    });
    if (stuckLinkedIn.count > 0) console.log(`[WORKER] Recovered ${stuckLinkedIn.count} stale LinkedIn posts.`);

    // 2. Recover Generic Posts
    const stuckGeneric = await db.scheduledPost.updateMany({
        where: {
            status: { in: ['PROCESSING', 'PENDING'] },
            updatedAt: { lte: tenMinutesAgo }
        },
        data: {
            status: 'SCHEDULED'
        }
    });
    if (stuckGeneric.count > 0) console.log(`[WORKER] Recovered ${stuckGeneric.count} stale Generic posts.`);
}

async function checkAndProcess() {
    if (isRunning) {
        console.log("[WORKER] Previous run still in progress. Skipping this tick.");
        return;
    }

    isRunning = true;
    const now = new Date();
    console.log(`[WORKER] [${now.toISOString()}] Starting check cycle...`);

    try {
        await recoverStaleJobs();
        await processScheduledLinkedInPosts(now);
        await processScheduledGenericPosts(now);
        await processLegacyContentQueue(now);
    } catch (error: any) {
        console.error("[WORKER] [CRITICAL] Loop error:", error.message);
    } finally {
        isRunning = false;
        console.log(`[WORKER] [${new Date().toISOString()}] Cycle complete.`);
    }
}

async function processScheduledLinkedInPosts(now: Date) {
    const duePosts = await dbRetry(() => db.linkedInPost.findMany({
        where: {
            status: 'SCHEDULED',
            scheduledAt: { lte: now }
        },
        take: 50
    }));

    if (duePosts.length > 0) {
        console.log(`[WORKER] [LinkedIn] Found ${duePosts.length} due posts.`);
    }

    for (const post of duePosts) {
        try {
            console.log(`[WORKER] [LinkedIn] Dispatching post ${post.id}`);

            const result = await dbRetry(() => db.linkedInPost.updateMany({
                where: {
                    id: post.id,
                    status: 'SCHEDULED'
                },
                data: {
                    status: 'PENDING',
                    updatedAt: new Date()
                }
            }));

            if (result.count === 0) continue;

            await inngest.send({
                name: "linkedin/post.publish",
                data: { postId: post.id }
            });

            console.log(`[WORKER] [LinkedIn] Successfully dispatched post ${post.id} to Inngest.`);
        } catch (error: any) {
            console.error(`[WORKER] [LinkedIn] Dispatch failure for post ${post.id}:`, error.message);
            // Move it back to SCHEDULED so it can be retried or picked up by recovery if needed
            try {
                await db.linkedInPost.update({
                    where: { id: post.id },
                    data: {
                        status: 'SCHEDULED',
                        errorMessage: `Worker dispatch error: ${error.message}`
                    }
                });
            } catch (e) { }
        }
    }
}

async function processScheduledGenericPosts(now: Date) {
    const duePosts = await dbRetry(() => db.scheduledPost.findMany({
        where: {
            status: 'SCHEDULED',
            scheduledAt: { lte: now }
        },
        include: { socialAccount: true },
        take: 50
    }));

    if (duePosts.length > 0) {
        console.log(`[WORKER] [Generic] Found ${duePosts.length} due posts.`);
    }

    for (const post of duePosts) {
        try {
            console.log(`[WORKER] [Generic] Processing post ${post.id} (${post.platform})`);

            // Use 'PROCESSING' state during the fetch
            const result = await dbRetry(() => db.scheduledPost.updateMany({
                where: {
                    id: post.id,
                    status: 'SCHEDULED'
                },
                data: {
                    status: 'PROCESSING',
                    updatedAt: new Date()
                }
            }));

            if (result.count === 0) continue;

            const accessToken = await getValidAccessToken(post.socialAccountId);
            if (!accessToken) throw new Error("Failed to get access token (revoked or expired)");

            const webhookUrl = process.env.N8N_PUBLISH_WEBHOOK_URL;
            if (!webhookUrl) {
                console.error("[WORKER] [Generic] N8N_PUBLISH_WEBHOOK_URL is not set.");
                await db.scheduledPost.update({
                    where: { id: post.id },
                    data: { status: 'FAILED' }
                });
                continue;
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.WEBHOOK_SECRET || ''
                },
                body: JSON.stringify({
                    postId: post.id,
                    accessToken,
                    postType: post.postType,
                    contentText: post.contentText,
                    mediaUrl: post.mediaUrl,
                    targetType: post.targetType,
                    targetId: post.targetId,
                    authorUrn: post.socialAccount.platformAccountId,
                    callbackUrl: `${getBaseUrl()}/api/posts/update-status`
                }),
                signal: AbortSignal.timeout(15000) // Increased to 15s
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Webhook API Error (${response.status}): ${errorData.substring(0, 100)}`);
            }

            console.log(`[WORKER] [Generic] Officially dispatched post ${post.id}. Status is currently PROCESSING until callback.`);

        } catch (error: any) {
            console.error(`[WORKER] [Generic] Execution failure for post ${post.id}:`, error.message);
            try {
                await db.scheduledPost.update({
                    where: { id: post.id },
                    data: {
                        status: 'FAILED',
                        // If we had an error field, we'd log it here.
                    }
                });
            } catch (e) { }
        }
    }
}

async function processLegacyContentQueue(now: Date) {
    try {
        const pendingJobs = await dbRetry(() => db.contentQueue.findMany({
            where: {
                status: 'pending',
                scheduledAt: { lte: now }
            },
            take: 20
        }));

        for (const job of pendingJobs) {
            try {
                // For legacy queue, we just push to processing status as a stub
                await db.contentQueue.update({
                    where: { id: job.id },
                    data: { status: 'processing' }
                });
            } catch (e) { }
        }
    } catch (error: any) {
        console.error("[WORKER] [Queue] Error:", error.message);
    }
}

// CONFIGURATION: Hourly heartbeat log, minutely execution
console.log("[WORKER] Scheduler started. Monitoring database for due posts...");
cron.schedule('* * * * *', checkAndProcess);

// Run immediately on start
checkAndProcess();
