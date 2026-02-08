import { sendVerificationEmail } from './lib/mail';
import * as dotenv from 'dotenv';

dotenv.config();

async function testResendFinal() {
    // IMPORTANT: Resend free tier only allows sending to the email you signed up with
    // Replace this with your Resend account email if it's different!
    const testEmail = 'usergmail@gmail.com';
    const testToken = 'final-test-token';

    console.log('--- Resend Final Test ---');
    console.log(`Target Email: ${testEmail}`);

    const result = await sendVerificationEmail(testEmail, testToken);

    if (result) {
        console.log('\n✅ Script says Success!');
        console.log('1. Check your Inbox (and Spam folder).');
        console.log('2. If not there, check Resend Dashboard "Emails" tab to see if it was blocked.');
    } else {
        console.log('\n❌ Script failed. Check error above.');
    }
}

testResendFinal();
