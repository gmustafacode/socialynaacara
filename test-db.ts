
import { PrismaClient } from './lib/generated/prisma'

const prisma = new PrismaClient()

async function test() {
    console.log('Testing DB connection...')
    try {
        const start = Date.now()
        const users = await prisma.user.findMany({ take: 1 })
        console.log(`Successfully connected! Found ${users.length} users. Took ${Date.now() - start}ms`)
    } catch (e) {
        console.error('Failed to connect to DB:', e)
    } finally {
        await prisma.$disconnect()
    }
}

test()
