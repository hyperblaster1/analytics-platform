-- Migration: Remove Seeds table and replace seedId with seedBaseUrl

-- Step 1: Add new seedBaseUrl columns to all affected tables
ALTER TABLE "PnodeGossipObservation" ADD COLUMN "seedBaseUrl" TEXT;
ALTER TABLE "PnodeStatsSample" ADD COLUMN "seedBaseUrl" TEXT;
ALTER TABLE "PodCreditsSnapshot" ADD COLUMN "seedBaseUrl" TEXT;
ALTER TABLE "IngestionRun" ADD COLUMN "seedBaseUrl" TEXT;

-- Step 2: Populate seedBaseUrl by joining with Seed table
UPDATE "PnodeGossipObservation" 
SET "seedBaseUrl" = (SELECT "baseUrl" FROM "Seed" WHERE "Seed"."id" = "PnodeGossipObservation"."seedId")
WHERE "seedId" IS NOT NULL;

UPDATE "PnodeStatsSample" 
SET "seedBaseUrl" = (SELECT "baseUrl" FROM "Seed" WHERE "Seed"."id" = "PnodeStatsSample"."seedId")
WHERE "seedId" IS NOT NULL;

UPDATE "PodCreditsSnapshot" 
SET "seedBaseUrl" = (SELECT "baseUrl" FROM "Seed" WHERE "Seed"."id" = "PodCreditsSnapshot"."seedId")
WHERE "seedId" IS NOT NULL;

UPDATE "IngestionRun" 
SET "seedBaseUrl" = (SELECT "baseUrl" FROM "Seed" WHERE "Seed"."id" = "IngestionRun"."seedId")
WHERE "seedId" IS NOT NULL;

-- Step 3: Make seedBaseUrl NOT NULL for PnodeGossipObservation (required field)
-- First, handle any NULL values (shouldn't exist, but just in case)
UPDATE "PnodeGossipObservation" 
SET "seedBaseUrl" = '' 
WHERE "seedBaseUrl" IS NULL;

ALTER TABLE "PnodeGossipObservation" ALTER COLUMN "seedBaseUrl" SET NOT NULL;

-- Step 4: Drop foreign key constraints
ALTER TABLE "PnodeGossipObservation" DROP CONSTRAINT IF EXISTS "PnodeGossipObservation_seedId_fkey";
ALTER TABLE "PnodeStatsSample" DROP CONSTRAINT IF EXISTS "PnodeStatsSample_seedId_fkey";

-- Step 5: Drop indexes on old seedId columns
DROP INDEX IF EXISTS "PnodeGossipObservation_seedId_idx";
DROP INDEX IF EXISTS "PnodeStatsSample_seedId_idx";
DROP INDEX IF EXISTS "IngestionRun_seedId_idx";

-- Step 6: Drop old seedId columns
ALTER TABLE "PnodeGossipObservation" DROP COLUMN "seedId";
ALTER TABLE "PnodeStatsSample" DROP COLUMN "seedId";
ALTER TABLE "PodCreditsSnapshot" DROP COLUMN "seedId";
ALTER TABLE "IngestionRun" DROP COLUMN "seedId";

-- Step 7: Create new indexes on seedBaseUrl columns
CREATE INDEX "PnodeGossipObservation_seedBaseUrl_idx" ON "PnodeGossipObservation"("seedBaseUrl");
CREATE INDEX "PnodeStatsSample_seedBaseUrl_idx" ON "PnodeStatsSample"("seedBaseUrl");
CREATE INDEX "IngestionRun_seedBaseUrl_idx" ON "IngestionRun"("seedBaseUrl");

-- Step 8: Drop the Seed table
DROP TABLE IF EXISTS "Seed";

