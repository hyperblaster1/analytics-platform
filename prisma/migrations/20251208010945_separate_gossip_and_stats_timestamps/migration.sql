-- AlterTable: Rename lastSeen to gossipLastSeen and lastSeenTimestamp to gossipLastSeenTimestamp
-- This separates gossip timestamps from stats timestamps for clarity
-- Note: Migration already partially applied - columns exist, just migrating data if needed

-- Migrate existing data from old columns to new columns (if old columns exist and new columns are null)
UPDATE "Pnode" SET "gossipLastSeen" = "lastSeen" WHERE "lastSeen" IS NOT NULL AND "gossipLastSeen" IS NULL;
UPDATE "Pnode" SET "gossipLastSeenTimestamp" = "lastSeenTimestamp" WHERE "lastSeenTimestamp" IS NOT NULL AND "gossipLastSeenTimestamp" IS NULL;

