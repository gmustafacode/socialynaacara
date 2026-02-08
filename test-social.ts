
import { PrismaClient } from './lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing socialAccount query...');
        const accounts = await prisma.socialAccount.findMany();
        console.log(`Found ${accounts.length} social accounts.`);
        if (accounts.length > 0) {
            console.log('First account sample (redacted tokens):', {
                ...accounts[0],
                encryptedAccessToken: 'REDACTED',
                encryptedRefreshToken: 'REDACTED'
            });
        }
        console.log('✅ socialAccount query successful!');
    } catch (error) {
        console.error('❌ socialAccount query failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
