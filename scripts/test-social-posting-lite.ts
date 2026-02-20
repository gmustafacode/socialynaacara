import db from '../lib/db';
import { Inngest } from 'inngest';

const inngest = new Inngest({ id: "social-sync-ara" });

async function testSocialPosting() {
    console.log("Starting Social Posting Test (Lite)...");

    const socialAccountId = "03d1fe5d-e6ed-4146-b6a3-ad58f5a999ec";
    const contentId = "931f52c9-1691-44a4-9151-df3d1fc2302e";

    try {
        const account = await db.socialAccount.findUnique({ where: { id: socialAccountId } });
        if (!account) throw new Error("Account not found");

        const userId = account.userId;
        const content = await db.contentQueue.findUnique({ where: { id: contentId } });
        if (!content) throw new Error("Content not found");

        console.log(`Using content: ${content.title}`);

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

        console.log("Dispatching to Inngest...");
        await inngest.send({
            name: "linkedin/post.publish",
            data: { postId: post.id }
        });

        console.log("✅ Successfully dispatched to Inngest.");

    } catch (error: any) {
        console.error("❌ Test failed:", error.message || error);
    }
}

testSocialPosting().then(() => {
    console.log("Test finished.");
    // Small delay to ensure network buffers are flushed before process.exit
    setTimeout(() => process.exit(0), 1000);
});
