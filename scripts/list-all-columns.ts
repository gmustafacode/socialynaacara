import db from '../lib/db';

async function listAllColumns() {
    console.log("Listing all columns in public schema...");
    try {
        const columns: any[] = await (db as any).$queryRawUnsafe(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            ORDER BY table_name, ordinal_position;
        `);

        const tables: Record<string, string[]> = {};
        columns.forEach(c => {
            if (!tables[c.table_name]) tables[c.table_name] = [];
            tables[c.table_name].push(c.column_name);
        });

        console.log(JSON.stringify(tables, null, 2));
    } catch (e) {
        console.error("Error listing columns:", e);
    }
}

listAllColumns().then(() => process.exit());
