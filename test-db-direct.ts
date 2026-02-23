
import { PrismaClient } from './lib/generated/prisma'
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DIRECT_URL
        }
    }
})

async function test() {
    console.log('Testing DIRECT DB connection (Port 5432)...')
    try {
        const start = Date.now()
        const users = await prisma.user.findMany({ take: 1 })
        console.log(`Successfully connected! Found ${users.length} users. Took ${Date.now() - start}ms`)
    } catch (e) {
        console.error('Failed to connect to DIRECT DB:', e)
    } finally {
        await prisma.$disconnect()
    }
}

test()
