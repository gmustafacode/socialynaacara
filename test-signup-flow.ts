import db from './lib/db';
import * as dotenv from 'dotenv';
// import fetch from 'node-fetch'; // Not needed in Node 24

dotenv.config();

async function testSignupFlow() {
    const email = 'testuser_' + Date.now() + '@example.com';
    const password = 'Password123!';
    const name = 'Test User';

    console.log(`--- Testing Signup Flow for ${email} ---`);

    try {
        // 1. Call Signup API
        console.log('Step 1: Calling signup API...');
        const response = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
            headers: { 'Content-Type': 'application/json' }
        });

        const data: any = await response.json();
        console.log('Signup Response:', data);

        if (!response.ok) {
            throw new Error(`Signup failed: ${JSON.stringify(data)}`);
        }

        // 2. Verify Database Record
        console.log('\nStep 2: Verifying database entries...');
        const user = await db.user.findUnique({
            where: { email },
            include: {
                // prisma generated client doesn't automatically include relations unless specified or using fluent api
            }
        });

        if (!user) {
            throw new Error('User was not created in the database.');
        }
        console.log('✅ User created in database.');

        const token = await db.verificationToken.findFirst({
            where: { identifier: email }
        });

        if (!token) {
            throw new Error('Verification token was not created in the database.');
        }
        console.log('✅ Verification token created in database.');
        console.log('   Token:', token.token);

        // 3. Test verification link (optional, but good)
        console.log('\nStep 3: Verification link would be:');
        console.log(`http://localhost:3000/api/auth/verify?token=${token.token}`);

        console.log('\n--- Full Signup Flow Test Passed! ---');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
    } finally {
        // Cleanup
        // await db.user.delete({ where: { email } });
        await db.$disconnect();
    }
}

testSignupFlow();
