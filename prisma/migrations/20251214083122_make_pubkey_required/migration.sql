/*
  Warnings:

  - Made the column `pubkey` on table `Pnode` required. This step will fail if there are existing NULL values in that column.

*/
-- Delete related records first (foreign key constraints)
DELETE FROM "PnodeGossipObservation" WHERE "pnodeId" IN (SELECT "id" FROM "Pnode" WHERE "pubkey" IS NULL);
DELETE FROM "PnodeStatsSample" WHERE "pnodeId" IN (SELECT "id" FROM "Pnode" WHERE "pubkey" IS NULL);

-- Delete pnodes with null pubkeys (these should not exist if pubkey is always present)
DELETE FROM "Pnode" WHERE "pubkey" IS NULL;

-- AlterTable
ALTER TABLE "Pnode" ALTER COLUMN "pubkey" SET NOT NULL;
