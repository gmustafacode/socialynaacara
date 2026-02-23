import { PrismaClient } from './lib/generated/prisma'

const prisma = new PrismaClient()

async function debug() {
    console.log('--- Debugging Automation Logs ---')
    try {
        const preferences = await prisma.preference.findMany({
            where: {
                automationLevel: { in: ['Full Auto', 'Semi-Auto'] }
            }
        })

        for (const pref of preferences) {
            console.log(`USER_ID: ${pref.userId}`)
            console.log(`TIMEZONE: ${pref.timezone}`)
            console.log(`SCHEDULE: ${JSON.stringify(pref.postingSchedule)}`)
        }

        const logs = await prisma.cronExecutionLog.findMany({
            orderBy: { startedAt: 'desc' },
            take: 30
        })
        console.log(`RECENT_CRON_LOGS:`)
        logs.forEach(log => {
            console.log(`LOG | ID: ${log.id} | Start: ${log.startedAt.toISOString()} | Proc: ${log.processed} | Pub: ${log.published} | Err: ${log.errorsCount}`)
        })

        const now = new Date()
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

        const sPosts = await prisma.scheduledPost.findMany({
            where: { createdAt: { gte: fourHoursAgo } },
            orderBy: { createdAt: 'desc' }
        })
        console.log(`RECENT_SCHEDULED_POSTS:`)
        sPosts.forEach(p => {
            console.log(`POST | ID: ${p.id} | Status: ${p.status} | Created: ${p.createdAt.toISOString()} | Sch: ${p.scheduledAt?.toISOString()} | Err: ${p.lastError}`)
        })

    } catch (e) {
        console.error('Debug script failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

debug()
