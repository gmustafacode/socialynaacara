
import { inngest } from "./client";
import { fetchRSS } from "../ingestion/connectors/rss";
import { fetchReddit } from "../ingestion/connectors/reddit";
import { fetchNewsAPI } from "../ingestion/connectors/news";
import { fetchUnsplash } from "../ingestion/connectors/unsplash";
import { fetchPexels } from "../ingestion/connectors/pexels";
import { processIngestedContent } from "../ingestion/processor";
import { NormalizedContent } from "../ingestion/types";

/**
 * Scheduled Ingestion Engine
 * Runs based on a cron schedule defined in environment variables.
 * Default: every 4 hours if not specified.
 */
export const scheduledContentIngestion = inngest.createFunction(
    {
        id: "scheduled-content-ingestion",
        retries: 2
    },
    { cron: process.env.INGESTION_CRON || "0 */4 * * *" },
    async ({ step }) => {
        const sources = ['rss', 'reddit', 'news_api', 'unsplash', 'pexels'];
        const category = 'technology';
        const query = 'technology';

        const results = [];

        for (const source of sources) {
            const items = await step.run(`fetch-${source}`, async () => {
                let fetched: NormalizedContent[] = [];
                switch (source) {
                    case 'rss':
                        fetched = await fetchRSS('https://feeds.feedburner.com/TechCrunch/');
                        break;
                    case 'reddit':
                        fetched = await fetchReddit(category);
                        break;
                    case 'news_api':
                        fetched = await fetchNewsAPI(category);
                        break;
                    case 'unsplash':
                        fetched = await fetchUnsplash(query);
                        break;
                    case 'pexels':
                        fetched = await fetchPexels(query);
                        break;
                }
                return fetched;
            });

            if (items.length > 0) {
                // Convert strings back to Dates because Inngest serializes step outputs to JSON
                const itemsWithDates = items.map((item: any) => ({
                    ...item,
                    publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined
                }));

                const result = await step.run(`process-${source}`, async () => {
                    return await processIngestedContent(source as any, itemsWithDates);
                });
                results.push(result);
            }
        }

        return {
            status: "success",
            processedSources: results.length,
            details: results
        };
    }
);
