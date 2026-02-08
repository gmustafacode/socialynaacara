import { sendVerificationEmail } from './lib/mail';
import * as dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
    const testEmail = 'test@example.com';
    const testToken = 'test-token-123';

    console.log(`Starting email test for ${testEmail}...`);
    try {
        const result = await sendVerificationEmail(testEmail, testToken);
        if (result) {
            console.log('✅ Test email function executed. Check the output above for Ethereal/Log details.');
        } else {
            console.log('❌ Test email function returned null (likely failed but caught).');
        }
    } catch (error) {
        console.error('❌ Test email crashed:', error);
    }
}

testEmail();
