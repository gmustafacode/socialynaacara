import db from '../lib/db';
import { inngest } from '../lib/inngest/client';

async function testSocialPosting() {
    console.log("Starting Social Posting Test...");
    console.log("Inngest Client type:", typeof inngest);
    if (inngest) {
        console.log("Inngest Send Method type:", typeof (inngest as any).send);
    } else {
        console.error("FATAL: Inngest client is undefined!");
        process.exit(1);
    }

    // Synchronize with the actual account-user link found in DB
    const socialAccountId = "03d1fe5d-e6ed-4146-b6a3-ad58f5a999ec";
    const contentId = "931f52c9-1691-44a4-9151-df3d1fc2302e";

    try {
        const account = await db.socialAccount.findUnique({ where: { id: socialAccountId } });
        if (!account) throw new Error("Account not found");

        const userId = account.userId;
        console.log(`Using Social Account: ${socialAccountId} (User: ${userId})`);

        const content = await db.contentQueue.findUnique({ where: { id: contentId } });
        if (!content) throw new Error("Content not found");

        console.log(`Using content: ${content.title}`);

        // 1. Create LinkedIn Post
        const post = await db.linkedInPost.create({
            data: {
                userId,
                socialAccountId,
                postType: "ARTICLE",
                title: content.title,
                description: content.summary || "No summary available",
                youtubeUrl: null,
                mediaUrls: [content.sourceUrl].filter(Boolean) as string[],
                targetType: "FEED",
                visibility: "PUBLIC",
                status: "DRAFT",
                groupIds: []
            }
        });

        console.log(`Created LinkedIn Post: ${post.id}`);

        // 2. Dispatch to Inngest
        console.log("Dispatching to Inngest...");
        await inngest.send({
            name: "linkedin/post.publish",
            data: { postId: post.id }
        });

        console.log("✅ Successfully dispatched to Inngest.");
        console.log("Check the Inngest Dev Server at http://localhost:8288 or worker logs for results.");

    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

testSocialPosting().then(() => process.exit());