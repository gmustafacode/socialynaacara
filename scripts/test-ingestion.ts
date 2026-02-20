import { fetchRSS } from '../lib/ingestion/connectors/rss';
import { processIngestedContent } from '../lib/ingestion/processor';
import 'dotenv/config';

async function testIngestion() {
    console.log("Starting manual ingestion test...");

    try {
        const source = 'rss';
        const url = 'https://feeds.feedburner.com/TechCrunch/';
        console.log(`Fetching from ${url}...`);

        const items = await fetchRSS(url);
        console.log(`Fetched ${items.length} items.`);

        if (items.length > 0) {
            console.log("Sample item title:", items[0].title);
            console.log("Processing items...");
            const result = await processIngestedContent(source, items);
            console.log("Ingestion result:", JSON.stringify(result, null, 2));
        } else {
            console.log("No items fetched. Check internet connection or RSS URL.");
        }
    } catch (error) {
        console.error("Test failed:", error);
    } finally {
        // Shared db instance, no need to disconnect in standard tsx runs if it handles it
    }
}

testIngestion();
