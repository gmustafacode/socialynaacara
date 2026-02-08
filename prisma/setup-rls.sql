
-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "social_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "content_queue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ai_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "preferences" ENABLE ROW LEVEL SECURITY;

-- Policies for social_accounts
DROP POLICY IF EXISTS "Users can only access their own social accounts" ON "social_accounts";
CREATE POLICY "Users can only access their own social accounts" ON "social_accounts"
    FOR ALL
    USING (auth.uid()::text = userId);

-- Policies for content_queue
DROP POLICY IF EXISTS "Users can only access their own content queue" ON "content_queue";
CREATE POLICY "Users can only access their own content queue" ON "content_queue"
    FOR ALL
    USING (auth.uid()::text = userId);

-- Policies for post_history
DROP POLICY IF EXISTS "Users can only access their own post history" ON "post_history";
CREATE POLICY "Users can only access their own post history" ON "post_history"
    FOR ALL
    USING (auth.uid()::text = userId);

-- Policies for ai_logs
DROP POLICY IF EXISTS "Users can only access their own AI logs" ON "ai_logs";
CREATE POLICY "Users can only access their own AI logs" ON "ai_logs"
    FOR ALL
    USING (auth.uid()::text = userId);

-- Policies for preferences
DROP POLICY IF EXISTS "Users can only access their own preferences" ON "preferences";
CREATE POLICY "Users can only access their own preferences" ON "preferences"
    FOR ALL
    USING (auth.uid()::text = userId);

-- Note: To make this work with Next-Auth and Prisma, you need to ensure the DB connection
-- sets the 'request.jwt.claims' variable or use a custom function to link Next-Auth session IDs to RLS.
