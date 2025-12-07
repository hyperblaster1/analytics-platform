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
    "failureCount" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Pnode" ("address", "createdAt", "id", "lastSeen", "lastSeenTimestamp", "updatedAt", "version") SELECT "address", "createdAt", "id", "lastSeen", "lastSeenTimestamp", "updatedAt", "version" FROM "Pnode";
DROP TABLE "Pnode";
ALTER TABLE "new_Pnode" RENAME TO "Pnode";
CREATE UNIQUE INDEX "Pnode_address_key" ON "Pnode"("address");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
