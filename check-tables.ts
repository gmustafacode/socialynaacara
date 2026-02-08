import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTables() {
    try {
        const tables = await prisma.$queryRaw`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `;
        console.log('Tables in public schema:');
        console.table(tables);
    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
