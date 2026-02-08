import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        await prisma.$connect();
        console.log('✅ Prisma connected successfully.');

        const userCount = await prisma.user.count();
        console.log(`✅ Successfully queried User table. Count: ${userCount}`);

        console.log('Database connection test passed!');
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
