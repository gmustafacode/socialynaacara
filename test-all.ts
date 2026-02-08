import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnections() {
    console.log('--- Database Connection Test ---');

    // 1. Test Prisma (PostgreSQL)
    const prisma = new PrismaClient();
    try {
        console.log('Testing Prisma connection...');
        await prisma.$connect();
        console.log('✅ Prisma: Connected successfully.');
        const userCount = await prisma.user.count();
        console.log(`✅ Prisma: User count: ${userCount}`);
    } catch (error: any) {
        console.error('❌ Prisma: Connection failed:');
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
    }

    // 2. Test Supabase SDK (HTTP API)
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    try {
        console.log('\nTesting Supabase SDK connection...');
        const { data, error, count } = await supabase.from('users').select('*', { count: 'exact', head: true });
        if (error) throw error;
        console.log('✅ Supabase SDK: Connected successfully.');
        console.log(`✅ Supabase SDK: User count: ${count}`);
    } catch (error: any) {
        console.error('❌ Supabase SDK: Connection failed:');
        console.error(error.message);
    }

    console.log('\n--- Test Completed ---');
}

testConnections();
