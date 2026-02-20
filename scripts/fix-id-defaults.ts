import db from '../lib/db';

async function fixDefaults() {
    console.log("Fixing ID defaults (gen_random_uuid)...");
    const queries = [
        'CREATE EXTENSION IF NOT EXISTS "pgcrypto";',
        'ALTER TABLE "content_ai_analysis" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();',
        'ALTER TABLE "ai_processing_logs" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();'
    ];

    for (const q of queries) {
        try {
            console.log(`Executing: ${q}`);
            await (db as any).$executeRawUnsafe(q);
            console.log("✅ Success");
        } catch (e) {
            console.error("❌ Failed:", e.message);
        }
    }
}

fixDefaults().then(() => process.exit());
