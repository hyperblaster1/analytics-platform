-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pnode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "version" TEXT,
    "lastSeen" DATETIME,
    "lastSeenTimestamp" BIGINT,
    "reachable" BOOLEAN NOT NULL DEFAULT false,
    "lastError" TEXT,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastStatsAttemptAt" DATETIME,
    "lastStatsSuccessAt" DATETIME,
    "nextStatsAllowedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pnode" ("address", "createdAt", "failureCount", "id", "lastError", "lastSeen", "lastSeenTimestamp", "reachable", "updatedAt", "version") SELECT "address", "createdAt", coalesce("failureCount", 0) AS "failureCount", "id", "lastError", "lastSeen", "lastSeenTimestamp", "reachable", "updatedAt", "version" FROM "Pnode";
DROP TABLE "Pnode";
ALTER TABLE "new_Pnode" RENAME TO "Pnode";
CREATE UNIQUE INDEX "Pnode_address_key" ON "Pnode"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
