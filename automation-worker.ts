
import db from './lib/db';
import { getValidAccessToken } from './lib/oauth';
import { LinkedInPostingService } from './lib/linkedin-posting-service';

async function processQueue() {
    console.log("[WORKER] LEGACY WORKER DETECTED. SKIPPING. Use Inngest instead.");
    return;
    console.log("[WORKER] Starting queue processing...");

    const pendingJobs = await db.contentQueue.findMany({
        where: {
            status: 'pending',
            scheduledAt: {
                lte: new Date()
            }
        },
        orderBy: {
            scheduledAt: 'asc'
        },
        include: {
            user: {
                include: {
                    socialAccounts: true
                }
            }
        },
        take: 10 // Process in batches
    });

    for (const job of pendingJobs) {
        try {
            console.log(`[WORKER] [${job.id}] Picking up job for user ${job.userId}`);

            // Mark as processing to avoid duplicate runs if another worker instance is active
            await db.contentQueue.update({
                where: { id: job.id },
                data: { status: 'processing' }
            });

            const payload = JSON.parse(job.rawContent || '{}');
            const targetPlatform = payload.platform || 'linkedin';

            const account = job.user?.socialAccounts.find(a =>
                a.platform.toLowerCase() === targetPlatform.toLowerCase() &&
                a.status === 'active'
            );

            if (!account) {
                throw new Error(`No active account found for ${targetPlatform}`);
            }

            if (targetPlatform === 'linkedin') {
                const result = await LinkedInPostingService.publishPost(job.id);
                console.log(`[WORKER] [${job.id}] Result:`, result.status);

                await db.contentQueue.update({
                    where: { id: job.id },
                    data: {
                        status: result.status === 'PUBLISHED' ? 'posted' : 'failed',
                        updatedAt: new Date()
                    }
                });
            } else {
                throw new Error(`Platform ${targetPlatform} not supported yet`);
            }

        } catch (error: any) {
            console.error(`[WORKER] [${job.id}] Critical Failure:`, error.message);
            await db.contentQueue.update({
                where: { id: job.id },
                data: {
                    status: 'failed',
                    rawContent: JSON.stringify({
                        ...(JSON.parse(job.rawContent || '{}')),
                        lastError: error.message
                    }),
                    updatedAt: new Date()
                }
            });
        }
    }
}

// Running once for demonstration, in production this would be in a setInterval or Cron
processQueue()
    .then(() => console.log("[WORKER] Run complete."))
    .catch(console.error)
    .finally(() => db.$disconnect());
