-- AlterTable
ALTER TABLE "Pnode" ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN DEFAULT false;

-- Copy existing reachable values to isPublic as a fallback
UPDATE "Pnode" SET "isPublic" = "reachable" WHERE "reachable" IS NOT NULL;

-- Update isPublic from latest gossip observations where available
UPDATE "Pnode" p
SET "isPublic" = COALESCE(
  (SELECT go."isPublic" 
   FROM "PnodeGossipObservation" go 
   WHERE go."pnodeId" = p.id 
   ORDER BY go."observedAt" DESC 
   LIMIT 1),
  p."isPublic"
)
WHERE EXISTS (
  SELECT 1 FROM "PnodeGossipObservation" go WHERE go."pnodeId" = p.id
);

-- AlterTable
ALTER TABLE "Pnode" DROP COLUMN "reachable";

