import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // AES block size

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error("CRITICAL: ENCRYPTION_KEY must be set in environment variables and be at least 32 characters long.");
}

export function encrypt(text: string): string {
    if (!text) return '';
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!.slice(0, 32)), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error: any) {
        console.error("Encryption failed:", error);
        throw new Error(`Encryption failed: ${error.message}`);
    }
}

export function decrypt(text: string): string {
    if (!text) return '';
    try {
        const textParts = text.split(':');
        if (textParts.length < 2) throw new Error("Invalid encrypted text format");

        const iv = Buffer.from(textParts.shift() as string, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!.slice(0, 32)), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error: any) {
        console.error("Decryption failed:", error);
        throw new Error(`Decryption failed: ${error.message}`);
    }
}

