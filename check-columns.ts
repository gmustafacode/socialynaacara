
import { PrismaClient } from './lib/generated/prisma';

const prisma = new PrismaClient();

async function main() {
    try {
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
        console.log('Tables in DB:', JSON.stringify(tables, null, 2));

        const socialColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'social_accounts'
    `;
        console.log('Columns in social_accounts:', JSON.stringify(socialColumns, null, 2));

    } catch (error) {
        console.error('Error fetching info:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
