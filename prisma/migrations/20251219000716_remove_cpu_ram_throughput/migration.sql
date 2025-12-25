-- AlterTable
ALTER TABLE "PnodeStatsSample" DROP COLUMN IF EXISTS "cpuPercent",
DROP COLUMN IF EXISTS "ramUsedBytes",
DROP COLUMN IF EXISTS "ramTotalBytes",
DROP COLUMN IF EXISTS "deltaBytes",
DROP COLUMN IF EXISTS "deltaSeconds",
DROP COLUMN IF EXISTS "bytesPerSecond";
