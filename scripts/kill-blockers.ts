import db from '../lib/db';

async function killBlockers() {
    console.log("Identifying and killing blocking sessions...");
    try {
        const activity: any[] = await (db as any).$queryRawUnsafe(`
            SELECT pid, state, query 
            FROM pg_stat_activity 
            WHERE query LIKE '%content_queue%' 
            AND pid != pg_backend_pid();
        `);

        console.log(`Found ${activity.length} potential blocking sessions.`);

        for (const session of activity) {
            console.log(`Terminating PID ${session.pid}: ${session.query.substring(0, 50)}...`);
            await (db as any).$queryRawUnsafe(`SELECT pg_terminate_backend(${session.pid});`);
            console.log("✅ Terminated");
        }

    } catch (e) {
        console.error("Error killing blockers:", e);
    }
}

killBlockers().then(() => process.exit());
