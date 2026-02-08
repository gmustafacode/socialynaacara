
import axios from 'axios';
import { LinkedInAuthService } from './linkedin-auth-service';
import db from './db';

export interface LinkedInPostOptions {
    title?: string;
    description: string;
    youtubeUrl?: string;
    thumbnailUrl?: string;
    mediaUrls?: string[];
    visibility: 'PUBLIC' | 'CONTAINER';
    groupIds?: string[];
    postType?: string;
}

export class LinkedInPostingService {
    /**
     * Publishes a post to LinkedIn (Feed and/or Groups).
     */
    static async publishPost(postId: string) {
        const post = await db.linkedInPost.findUnique({
            where: { id: postId },
            include: { socialAccount: true }
        });

        if (!post) throw new Error("Post not found");

        // Idempotency Check: Prevent double-posting
        if (post.status === 'PUBLISHED' && post.linkedinPostUrn) {
            console.log(`[LinkedInPosting] Post ${postId} already published. URN: ${post.linkedinPostUrn}`);
            return {
                status: 'PUBLISHED',
                results: post.linkedinPostUrn.split(', '),
                errors: []
            };
        }

        // 1. Get valid access token (refreshes if needed)
        const accessToken = await LinkedInAuthService.getValidToken(post.socialAccountId);

        // Token validation logging
        console.log('[LinkedIn Debug] Token length:', accessToken.length);
        console.log('[LinkedIn Debug] Token prefix:', accessToken.substring(0, 20) + '...');

        // 2. Resolve LinkedIn Identity (URN)
        // Optimization: Use cached URN from DB if available
        let authorUrn = post.socialAccount.platformAccountId ?
            (post.socialAccount.platformAccountId.startsWith('urn:li:') ?
                post.socialAccount.platformAccountId :
                `urn:li:person:${post.socialAccount.platformAccountId}`) :
            null;

        if (!authorUrn) {
            try {
                const { getLinkedInProfile } = await import('./linkedin-token-validator');
                const profile = await getLinkedInProfile(accessToken);
                authorUrn = profile.id.startsWith('urn:li:') ? profile.id : `urn:li:person:${profile.id}`;

                // Save resolved URN for future use
                if (authorUrn) {
                    await db.socialAccount.update({
                        where: { id: post.socialAccountId },
                        data: { platformAccountId: authorUrn.replace('urn:li:person:', '') }
                    });
                }
            } catch (error: any) {
                console.error("[LinkedInPosting] Identity resolution failed:", error);
            }
        }

        if (!authorUrn) throw new Error("Could not resolve LinkedIn User ID");

        // Validation
        const description = post.description || "";
        if (description.length > 3000) {
            throw new Error("LinkedIn description exceeds 3000 character limit");
        }
        if (description.length === 0 && !post.mediaUrls?.length && !post.youtubeUrl) {
            throw new Error("Post content cannot be empty (must have text or media)");
        }

        const results: string[] = [];
        const errors: string[] = [];

        // 3. Auto-generate or Scrape thumbnail for maximum fidelity
        let finalThumbnailUrl = post.thumbnailUrl;
        const targetUrl = post.youtubeUrl || (post.mediaUrls.length > 0 ? post.mediaUrls[0] : null);

        if (!finalThumbnailUrl && targetUrl) {
            if (post.youtubeUrl) {
                const metadata = LinkedInPostingService.getYoutubeMetadata(post.youtubeUrl);
                if (metadata) {
                    try {
                        // Check if maxresdefault exists (HEAD request)
                        await axios.head(metadata.thumbnailUrl);
                        console.log(`[LinkedInPosting] Using maxres thumbnail: ${metadata.thumbnailUrl}`);
                        finalThumbnailUrl = metadata.thumbnailUrl;
                    } catch (e) {
                        const hqUrl = `https://i.ytimg.com/vi/${metadata.videoId}/hqdefault.jpg`;
                        console.log(`[LinkedInPosting] maxres failed, falling back to HQ: ${hqUrl}`);
                        finalThumbnailUrl = hqUrl;
                    }
                }
            } else if (post.postType === 'ARTICLE' || post.targetType === 'FEED') {
                // Proactive Scraper: If no thumbnail exists for a link, try to pull OG image
                try {
                    console.log(`[LinkedInPosting] Attempting to scrape OG metadata for: ${targetUrl}`);
                    const response = await axios.get(targetUrl, {
                        timeout: 10000,
                        maxContentLength: 1024 * 1024, // 1MB HTML limit
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialSyncBot/1.0)' }
                    });
                    const html = response.data;
                    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

                    if (ogMatch && ogMatch[1]) {
                        finalThumbnailUrl = ogMatch[1];
                        console.log(`[LinkedInPosting] Scraped hero image: ${finalThumbnailUrl}`);
                    }
                } catch (e: any) {
                    console.warn(`[LinkedInPosting] Scraper failed for ${targetUrl}:`, e.message);
                }
            }
        }

        // 4. Handle Feed Post
        if (post.targetType === 'FEED' || !post.targetType) { // Default to FEED if not set
            try {
                const urn = await this.createUgcPost(accessToken, authorUrn, {
                    postType: post.postType,
                    title: post.title || undefined,
                    description: description,
                    youtubeUrl: post.youtubeUrl || undefined,
                    thumbnailUrl: finalThumbnailUrl || undefined,
                    mediaUrls: post.mediaUrls,
                    visibility: post.visibility === 'CONTAINER' ? 'CONTAINER' : 'PUBLIC'
                });
                results.push(urn);
            } catch (err: any) {
                const data = err.response?.data;
                const errorMsg = data?.message || err.message || "Unknown error";
                const serviceCode = data?.serviceErrorCode ? ` (Code: ${data.serviceErrorCode})` : "";

                console.error("[LinkedInPosting] Feed post failed:", errorMsg + serviceCode);

                // Duplicate Content Rescue: If LinkedIn says it's a duplicate, extract the URN and treat as success
                const duplicateMatch = errorMsg.match(/duplicate of (urn:li:[a-zA-Z0-9:]+)/);
                if (duplicateMatch && duplicateMatch[1]) {
                    const existingUrn = duplicateMatch[1];
                    console.log(`[LinkedInPosting] Duplicate detected. Rescuing existing URN: ${existingUrn}`);
                    results.push(existingUrn);
                } else {
                    errors.push(`Feed post failed: ${errorMsg}${serviceCode}`);
                }
            }
        }

        // 5. Handle Group Posts - Sequential Execution (Better for Rate Limits)
        if (post.targetType === 'GROUP' && post.groupIds && post.groupIds.length > 0) {
            for (const groupId of post.groupIds) {
                try {
                    // Small delay between groups to avoid burst limits
                    if (post.groupIds.indexOf(groupId) > 0) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }

                    const urn = await this.createUgcPost(accessToken, authorUrn, {
                        postType: post.postType,
                        title: post.title || undefined,
                        description: description,
                        youtubeUrl: post.youtubeUrl || undefined,
                        thumbnailUrl: finalThumbnailUrl || undefined,
                        mediaUrls: post.mediaUrls,
                        visibility: 'CONTAINER',
                        groupIds: [groupId]
                    });
                    results.push(urn);
                } catch (err: any) {
                    const data = err.response?.data;
                    const errorMsg = data?.message || err.message || "Unknown error";
                    const serviceCode = data?.serviceErrorCode ? ` (Code: ${data.serviceErrorCode})` : "";

                    console.error(`[LinkedInPosting] Group post failed for ${groupId}:`, errorMsg + serviceCode);

                    // Duplicate Content Rescue for Groups
                    const duplicateMatch = errorMsg.match(/duplicate of (urn:li:[a-zA-Z0-9:]+)/);
                    if (duplicateMatch && duplicateMatch[1]) {
                        results.push(duplicateMatch[1]);
                    } else {
                        errors.push(`Group ${groupId} failed: ${errorMsg}${serviceCode}`);
                    }
                }
            }
        }

        // 5. Update Post Status
        const status = errors.length === 0 ? 'PUBLISHED' : (results.length > 0 ? 'PARTIAL_SUCCESS' : 'FAILED');
        await db.linkedInPost.update({
            where: { id: postId },
            data: {
                status,
                linkedinPostUrn: results.join(', '),
                errorMessage: errors.length > 0 ? errors.slice(0, 5).join(' | ') : null, // Cap error message length
                updatedAt: new Date()
            }
        });

        return { status, results, errors };
    }

    /**
     * Creates a UGC post via LinkedIn API.
     */
    private static async createUgcPost(
        accessToken: string,
        authorUrn: string,
        options: LinkedInPostOptions
    ): Promise<string> {
        let { title, description, youtubeUrl, thumbnailUrl, visibility, groupIds, postType, mediaUrls } = options;

        // Container is for groups
        const containerUrn = groupIds && groupIds.length > 0 ? `urn:li:group:${groupIds[0]}` : undefined;

        let shareMediaCategory = "NONE";
        let media: any[] = [];
        let finalDescription = description;

        // Enhanced Media Categorization
        const hasMediaUrls = mediaUrls && mediaUrls.length > 0;
        const isImage = postType === 'IMAGE' || postType === 'IMAGE_TEXT' || (hasMediaUrls && !youtubeUrl);
        const isVideo = postType === 'VIDEO' || postType === 'VIDEO_TEXT' || !!youtubeUrl;
        const isArticle = postType === 'ARTICLE';

        // STRATEGY: For maximum "Big Thumbnail" impact, we prefer the IMAGE category
        // with a native asset upload, even for links and videos.
        if (isImage || (thumbnailUrl && (isVideo || isArticle))) {
            shareMediaCategory = "IMAGE";

            // Process images: Download and upload to LinkedIn to get Asset URNs
            const mediaSources = isImage ? (mediaUrls || []) : [thumbnailUrl];

            const assetPromises = mediaSources.map(async (url) => {
                if (!url) return null;
                if (url.startsWith('urn:li:digitalmediaAsset')) return url;
                try {
                    return await this.uploadImageToLinkedIn(accessToken, authorUrn, url);
                } catch (e) {
                    console.error("[LinkedInPosting] Image upload failed:", e);
                    return null;
                }
            });

            const assets = (await Promise.all(assetPromises)).filter(Boolean) as string[];

            if (assets.length > 0) {
                media = assets.map(assetUrn => ({
                    status: "READY",
                    media: assetUrn,
                    // For single hero images, we omit title/description inside 'media'
                    // to force LinkedIn to prioritize the image as a "Full Width" element.
                    ...(assets.length > 1 ? {
                        description: { text: description.substring(0, 200) },
                        title: { text: title || "Gallery Image" }
                    } : {})
                }));

                // If this was originally a video/article, inject the link into the caption
                if (isVideo || isArticle) {
                    const link = youtubeUrl || (hasMediaUrls ? mediaUrls![0] : "");
                    if (link && !finalDescription.includes(link)) {
                        finalDescription = `${description}\n\n🔗 ${link}`;
                    }
                }
            } else if (isVideo || isArticle) {
                // Total fallback to ARTICLE if native upload fails
                shareMediaCategory = "ARTICLE";
                media = [{
                    status: "READY",
                    description: { text: description },
                    originalUrl: youtubeUrl || (hasMediaUrls ? mediaUrls![0] : undefined),
                    title: { text: title || (isVideo ? "Shared Video" : "Shared Article") },
                    thumbnails: thumbnailUrl ? [{ url: thumbnailUrl }] : []
                }];
            }
        } else if (isVideo || isArticle) {
            shareMediaCategory = "ARTICLE";
            media = [{
                status: "READY",
                description: { text: description },
                originalUrl: youtubeUrl || (hasMediaUrls ? mediaUrls![0] : undefined),
                title: { text: title || (isVideo ? "Shared Video" : "Shared Article") }
            }];
        }

        const payload = {
            author: authorUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: finalDescription
                    },
                    shareMediaCategory: shareMediaCategory,
                    media: shareMediaCategory === "NONE" ? undefined : media
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": visibility
            }
        };

        if (visibility === 'CONTAINER' && containerUrn) {
            (payload as any).containerEntity = containerUrn;
        }

        const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
            timeout: 30000, // 30s timeout for post creation
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
                'Content-Type': 'application/json'
            }
        });

        if (response.status !== 201) {
            throw new Error(`LinkedIn API Error: ${response.status} ${JSON.stringify(response.data)}`);
        }

        return response.data.id;
    }

    /**
     * Downloads an image from a URL and uploads it to LinkedIn to get an Asset URN.
     * This is required for "Native" image posts (Large Media Cards).
     */
    private static async uploadImageToLinkedIn(accessToken: string, authorUrn: string, imageUrl: string): Promise<string> {
        console.log(`[LinkedInPosting] Uploading image: ${imageUrl}`);

        // 1. Download the image with size limit (5MB) and memory protection
        const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

        const imageRes = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000, // 30s timeout
            maxContentLength: MAX_IMAGE_SIZE, // Prevent massive downloads
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (imageRes.data.length > MAX_IMAGE_SIZE) {
            throw new Error(`Media asset exceeds 5MB limit (${(imageRes.data.length / 1024 / 1024).toFixed(2)}MB)`);
        }

        const imageBuffer = Buffer.from(imageRes.data);

        // 2. Register the upload
        const registerPayload = {
            registerUploadRequest: {
                recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
                owner: authorUrn,
                serviceRelationships: [{
                    relationshipType: "OWNER",
                    identifier: "urn:li:userGeneratedContent"
                }]
            }
        };

        const registerRes = await axios.post('https://api.linkedin.com/v2/assets?action=registerUpload', registerPayload, {
            timeout: 30000,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        const uploadUrl = registerRes.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
        const assetUrn = registerRes.data.value.asset;

        // 3. Perform the binary upload
        await axios.put(uploadUrl, imageBuffer, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': imageRes.headers['content-type'] || 'image/jpeg'
            }
        });

        console.log(`[LinkedInPosting] Image registered as native asset: ${assetUrn}`);
        return assetUrn;
    }

    /**
     * Extracts YouTube ID and generates metadata.
     */
    static getYoutubeMetadata(url: string) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        const videoId = (match && match[7].length === 11) ? match[7] : null;

        if (!videoId) return null;

        return {
            videoId,
            thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${videoId}`
        };
    }
}
