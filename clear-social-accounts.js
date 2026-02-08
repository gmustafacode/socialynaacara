
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.socialAccount.deleteMany();
        console.log('Cleared social accounts');
    } catch (error) {
        console.error('Error clearing social accounts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
