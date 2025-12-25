-- DropIndex
DROP INDEX IF EXISTS "IngestionRun_seedBaseUrl_idx";

-- AlterTable
ALTER TABLE "IngestionRun" DROP COLUMN IF EXISTS "seedBaseUrl";

