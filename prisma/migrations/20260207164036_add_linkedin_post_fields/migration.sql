/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `social_accounts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "social_accounts" DROP COLUMN "expiresAt",
ADD COLUMN     "access_token_expires_at" TIMESTAMP(3),
ADD COLUMN     "expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "scheduled_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "postType" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "externalPostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linkedin_posts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "socialAccountId" TEXT NOT NULL,
    "postType" TEXT NOT NULL DEFAULT 'TEXT',
    "youtubeUrl" TEXT,
    "title" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "thumbnailUrl" TEXT,
    "mediaUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "targetType" TEXT NOT NULL,
    "groupIds" TEXT[],
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "encrypted_access_token" TEXT,
    "encrypted_refresh_token" TEXT,
    "encrypted_client_id" TEXT,
    "encrypted_client_secret" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "linkedinPostUrn" TEXT,
    "errorMessage" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linkedin_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_posts_userId_idx" ON "scheduled_posts"("userId");

-- CreateIndex
CREATE INDEX "scheduled_posts_status_idx" ON "scheduled_posts"("status");

-- CreateIndex
CREATE INDEX "scheduled_posts_scheduledAt_idx" ON "scheduled_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "linkedin_posts_userId_idx" ON "linkedin_posts"("userId");

-- CreateIndex
CREATE INDEX "linkedin_posts_status_idx" ON "linkedin_posts"("status");

-- CreateIndex
CREATE INDEX "linkedin_posts_scheduledAt_idx" ON "linkedin_posts"("scheduledAt");

-- CreateIndex
CREATE INDEX "content_queue_status_idx" ON "content_queue"("status");

-- CreateIndex
CREATE INDEX "content_queue_scheduled_at_idx" ON "content_queue"("scheduled_at");

-- CreateIndex
CREATE INDEX "social_accounts_userId_idx" ON "social_accounts"("userId");

-- CreateIndex
CREATE INDEX "social_accounts_platform_idx" ON "social_accounts"("platform");

-- CreateIndex
CREATE INDEX "social_accounts_status_idx" ON "social_accounts"("status");

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_posts" ADD CONSTRAINT "scheduled_posts_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_posts" ADD CONSTRAINT "linkedin_posts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "linkedin_posts" ADD CONSTRAINT "linkedin_posts_socialAccountId_fkey" FOREIGN KEY ("socialAccountId") REFERENCES "social_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
