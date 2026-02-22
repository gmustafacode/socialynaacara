import { z } from "zod";

/**
 * Common Schemas
 */
export const PlatformSchema = z.enum([
    "linkedin",
    "instagram",
    "tiktok",
    "google",
    "youtube",
    "x",
    "reddit",
    "facebook",
    "medium"
]);

/**
 * Content Generation API
 */
export const GenerateContentSchema = z.object({
    topic: z.string().min(3).max(500),
    audience: z.string().optional().default("General"),
    tone: z.string().optional().default("Professional"),
    platforms: z.array(PlatformSchema).optional().default(["linkedin"]),
    mediaType: z.enum(["text", "image", "video", "carousel"]).optional().default("text")
});

/**
 * Post Scheduling API
 */
export const SchedulePostSchema = z.object({
    accountId: z.string().uuid(),
    platform: PlatformSchema,
    contentType: z.enum(["ARTICLE", "IMAGE", "VIDEO", "POLL", "CAROUSEL"]).default("ARTICLE"),
    contentData: z.object({
        title: z.string().max(200).optional(),
        description: z.string().min(1, "Post body cannot be empty").max(3000),
        mediaUrl: z.string().url().optional(),
        thumbnailUrl: z.string().url().optional(),
        youtubeUrl: z.string().url().optional(),
    }),
    scheduledFor: z.string().datetime().optional(), // ISO string
    timezone: z.string().optional(),
});

/**
 * User Preference API
 */
export const PreferencesSchema = z.object({
    brandName: z.string().max(100).optional(),
    profileType: z.enum(["Personal", "Business", "Creator"]).optional(),
    industryNiche: z.string().max(100).optional(),
    audienceType: z.string().max(100).optional(),
    contentGoals: z.string().max(500).optional(),
    preferredPlatforms: z.array(z.string()).optional(),
    postingFrequency: z.string().optional(),
    automationLevel: z.enum(["Manual", "Semi-Auto", "Full Auto"]).optional(),
});

/**
 * Post Status Filtering
 */
export const PostStatusSchema = z.enum(["PENDING", "PROCESSING", "PUBLISHED", "FAILED", "CANCELLED", "PARTIAL_SUCCESS"]);

/**
 * Raw Post Creation (For manual entry via API)
 */
export const PostCreateSchema = z.object({
    socialAccountId: z.string().uuid(),
    postType: z.enum([
        "ARTICLE", "IMAGE", "VIDEO", "POLL", "CAROUSEL",
        // Additional types used by LinkedIn Composer and Universal Composer
        "TEXT", "TEXT_ONLY", "IMAGE_TEXT", "VIDEO_TEXT", "GROUP", "GROUP_POST"
    ]).default("TEXT"),
    contentText: z.string().min(1).max(3000),
    mediaUrl: z.string().url().optional().nullable(),
    targetType: z.enum(["FEED", "GROUP", "STORY"]).optional().default("FEED"),
    targetId: z.string().optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    publishNow: z.boolean().optional().default(false),
});
