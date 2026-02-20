import db from '../lib/db';

async function forceCreate() {
    console.log("Forcing table creation...");
    const tables = [
        {
            name: 'content_ai_analysis',
            sql: `CREATE TABLE IF NOT EXISTS "content_ai_analysis" (
                "id" TEXT PRIMARY KEY,
                "content_id" TEXT NOT NULL UNIQUE,
                "category" TEXT NOT NULL,
                "content_quality_score" INTEGER NOT NULL,
                "engagement_score" INTEGER NOT NULL,
                "virality_probability" INTEGER NOT NULL,
                "final_score" DOUBLE PRECISION NOT NULL,
                "recommended_platforms" JSONB NOT NULL,
                "content_type_recommendation" TEXT NOT NULL,
                "rewrite_needed" BOOLEAN NOT NULL,
                "reasoning" TEXT NOT NULL,
                "raw_llm_response" JSONB NOT NULL,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );`
        },
        {
            name: 'ai_processing_logs',
            sql: `CREATE TABLE IF NOT EXISTS "ai_processing_logs" (
                "id" TEXT PRIMARY KEY,
                "batch_id" TEXT NOT NULL,
                "batch_size" INTEGER NOT NULL,
                "processed" INTEGER NOT NULL,
                "approved" INTEGER NOT NULL,
                "review" INTEGER NOT NULL,
                "rejected" INTEGER NOT NULL,
                "ai_errors" INTEGER NOT NULL,
                "execution_time" INTEGER NOT NULL,
                "started_at" TIMESTAMP(3) NOT NULL,
                "finished_at" TIMESTAMP(3) NOT NULL,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
            );`
        }
    ];

    for (const t of tables) {
        try {
            console.log(`Creating ${t.name}...`);
            await (db as any).$executeRawUnsafe(t.sql);
            console.log(`✅ ${t.name} created (or existed).`);

            // Verify
            const check = await (db as any).$queryRawUnsafe(`SELECT 1 FROM "${t.name}" LIMIT 1`);
            console.log(`✅ Verified ${t.name} accessibility.`);
        } catch (e) {
            console.error(`❌ Failed ${t.name}:`, e.message);
        }
    }
}

forceCreate().then(() => process.exit());
