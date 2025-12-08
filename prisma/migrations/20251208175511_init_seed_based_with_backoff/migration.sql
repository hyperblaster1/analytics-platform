-- CreateTable
CREATE TABLE "Seed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT,
    "baseUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pnode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pubkey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reachable" BOOLEAN NOT NULL DEFAULT false,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastStatsAttemptAt" DATETIME,
    "lastStatsSuccessAt" DATETIME,
    "nextStatsAllowedAt" DATETIME
);

-- CreateTable
CREATE TABLE "PnodeGossipObservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seedId" INTEGER NOT NULL,
    "pnodeId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "version" TEXT,
    "lastSeenTimestamp" BIGINT,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PnodeGossipObservation_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PnodeGossipObservation_pnodeId_fkey" FOREIGN KEY ("pnodeId") REFERENCES "Pnode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PnodeStatsSample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pnodeId" INTEGER NOT NULL,
    "seedId" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuPercent" REAL,
    "ramUsedBytes" BIGINT,
    "ramTotalBytes" BIGINT,
    "uptimeSeconds" INTEGER,
    "packetsInPerSec" REAL,
    "packetsOutPerSec" REAL,
    "totalBytes" BIGINT,
    "activeStreams" INTEGER,
    CONSTRAINT "PnodeStatsSample_pnodeId_fkey" FOREIGN KEY ("pnodeId") REFERENCES "Pnode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PnodeStatsSample_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Seed_baseUrl_key" ON "Seed"("baseUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Pnode_pubkey_key" ON "Pnode"("pubkey");

