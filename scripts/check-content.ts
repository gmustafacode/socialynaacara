import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const count = await prisma.contentQueue.count()
    console.log(`Total items in ContentQueue: ${count}`)

    const pendingCount = await prisma.contentQueue.count({
        where: { status: 'pending' }
    })
    console.log(`Pending items: ${pendingCount}`)

    const ingestedLogs = await prisma.ingestionLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    })
    console.log('Recent Ingestion Logs:', JSON.stringify(ingestedLogs, null, 2))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
