import { sendVerificationEmail } from './lib/mail';
import * as dotenv from 'dotenv';

dotenv.config();

async function testResend() {
    const testEmail = 'usergmail@gmail.com'; // User's requested test email
    const testToken = 'resend-test-token-789';

    console.log(`Starting Resend integration test for ${testEmail}...`);
    try {
        const result = await sendVerificationEmail(testEmail, testToken);
        if (result) {
            console.log('✅ Resend test successful! ID:', (result as any).id);
        } else {
            console.log('❌ Resend test failed. Check console logs above.');
        }
    } catch (error) {
        console.error('❌ Resend test crashed:', error);
    }
}

testResend();
