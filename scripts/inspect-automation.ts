import { PrismaClient } from '../lib/generated/prisma'
const prisma = new PrismaClient()

async function main() {
    console.log("--- Automation Debug Report ---");

    // 1. Check Cron Execution Logs
    const logs = await prisma.cronExecutionLog.findMany({
        orderBy: { startedAt: 'desc' },
        take: 10
    });

    console.log("\nLast 10 Cron Executions:");
    logs.forEach(l => {
        console.log(`- Start: ${l.startedAt.toISOString()}, Processed: ${l.processed}, Published: ${l.published}, Errors: ${l.errorsCount}`);
    });

    // 2. Check User Preferences & Schedule
    const prefs = await prisma.preference.findMany({
        where: { automationLevel: { in: ['Full Auto', 'Semi-Auto'] } },
        include: { user: true }
    });

    console.log("\nUsers with Automation enabled:");
    for (const p of prefs) {
        console.log(`- User: ${p.userId} (${p.user.email})`);
        console.log(`  Level: ${p.automationLevel}`);
        console.log(`  Schedule: ${JSON.stringify(p.postingSchedule)}`);
        console.log(`  Timezone: ${p.timezone}`);

        // Check if anything was recently created in ContentQueue
        const recentQueue = await prisma.contentQueue.findMany({
            where: { userId: p.userId },
            orderBy: { createdAt: 'desc' },
            take: 3
        });
        console.log(`  Recent Queue items: ${recentQueue.length}`);
        recentQueue.forEach(q => console.log(`    * [${q.createdAt.toISOString()}] ${q.status}: ${q.title}`));
    }

    // 3. Check ScheduledPosts (especially failures)
    const recentScheduled = await prisma.scheduledPost.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    console.log("\nRecent Scheduled Posts (last 24h):");
    recentScheduled.forEach(s => {
        console.log(`- [${s.createdAt.toISOString()}] Platform: ${s.platform}, Status: ${s.status}, Error: ${s.lastError || 'none'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
