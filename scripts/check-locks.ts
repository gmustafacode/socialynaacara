import db from '../lib/db';

async function checkLocks() {
    console.log("Checking for active locks/sessions...");
    try {
        const activity = await (db as any).$queryRawUnsafe(`
            SELECT pid, state, query, wait_event_type, wait_event
            FROM pg_stat_activity
            WHERE query NOT LIKE '%pg_stat_activity%'
            AND state != 'idle';
        `);
        console.log("ACTIVE SESSIONS:", JSON.stringify(activity, null, 2));

        const locks = await (db as any).$queryRawUnsafe(`
            SELECT
                blocked_locks.pid AS blocked_pid,
                blocked_activity.query AS blocked_query,
                blocking_locks.pid AS blocking_pid,
                blocking_activity.query AS blocking_query
            FROM pg_catalog.pg_locks blocked_locks
            JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_locks.pid = blocked_activity.pid
            JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
                AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
                AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
                AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
                AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
                AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
                AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
                AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
                AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
                AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
                AND blocking_locks.pid != blocked_locks.pid
            JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_locks.pid = blocking_activity.pid
            WHERE NOT blocked_locks.GRANTED;
        `);
        console.log("LOCKS:", JSON.stringify(locks, null, 2));

    } catch (e) {
        console.error("Error checking locks:", e);
    }
}

checkLocks().then(() => process.exit());
