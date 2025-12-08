-- AlterTable: Rename lastSeen to gossipLastSeen and lastSeenTimestamp to gossipLastSeenTimestamp
-- This separates gossip timestamps from stats timestamps for clarity

-- Step 1: Add new columns
ALTER TABLE "Pnode" ADD COLUMN "gossipLastSeen" DATETIME;
ALTER TABLE "Pnode" ADD COLUMN "gossipLastSeenTimestamp" BIGINT;

-- Step 2: Migrate existing data
UPDATE "Pnode" SET "gossipLastSeen" = "lastSeen" WHERE "lastSeen" IS NOT NULL;
UPDATE "Pnode" SET "gossipLastSeenTimestamp" = "lastSeenTimestamp" WHERE "lastSeenTimestamp" IS NOT NULL;

-- Step 3: Drop old columns
ALTER TABLE "Pnode" DROP COLUMN "lastSeen";
ALTER TABLE "Pnode" DROP COLUMN "lastSeenTimestamp";

