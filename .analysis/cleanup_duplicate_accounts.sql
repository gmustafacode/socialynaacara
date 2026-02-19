-- Migration: Enforce One Account Per Platform Per User
-- This migration adds a unique constraint to prevent users from connecting
-- multiple accounts of the same platform (e.g., multiple LinkedIn accounts
-- Step 1: Identify and log duplicate accounts
-- (Run this query first to see what will be affected)
SELECT 
    "userId", 
    platform, 
    COUNT(*) as account_count,
    STRING_AGG(id::text, ', ') as account_ids
FROM social_accounts
GROUP BY "userId", platform
HAVING COUNT(*) > 1
ORDER BY account_count DESC;

-- Step 2: Clean up duplicates - Keep most recent account, delete older ones
-- This uses a CTE to identify which accounts to keep
WITH ranked_accounts AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY "userId", platform 
            ORDER BY "connectedAt" DESC, "lastVerifiedAt" DESC NULLS LAST
        ) as rn
    FROM social_accounts
)
DELETE FROM social_accounts
WHERE id IN (
    SELECT id 
    FROM ranked_accounts 
    WHERE rn > 1
);

-- Step 3: Add the unique constraint
-- This will prevent future duplicate connections at the database level
ALTER TABLE social_accounts
ADD CONSTRAINT user_platform_unique UNIQUE ("userId", platform);

-- Verification: Confirm no duplicates remain
SELECT 
    "userId", 
    platform, 
    COUNT(*) as account_count
FROM social_accounts
GROUP BY "userId", platform
HAVING COUNT(*) > 1;
-- Should return 0 rows
