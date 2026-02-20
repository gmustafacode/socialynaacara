import db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

async function testRawSqlPost() {
    console.log("Starting Raw SQL Posting Test...");

    const userId = "3ab52c6e-937a-4f03-9ce3-d0e4b7abdcd2";
    const socialAccountId = "03d1fe5d-e6ed-4146-b6a3-ad58f5a999ec";
    const postId = uuidv4();

    try {
        console.log(`Injecting post ${postId} for user ${userId}...`);

        await (db as any).$executeRawUnsafe(`
            INSERT INTO "linkedin_posts" (
                "id", "userId", "socialAccountId", "postType", "title", "description", "targetType", "visibility", "status", "createdAt", "updatedAt"
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
        `, postId, userId, socialAccountId, 'ARTICLE', 'Raw SQL Test', 'Testing foreign keys', 'FEED', 'PUBLIC', 'DRAFT');

        console.log("✅ Raw SQL insertion SUCCESS!");

    } catch (error) {
        console.error("❌ Raw SQL failed:", error.message);
    }
}

testRawSqlPost().then(() => process.exit());
