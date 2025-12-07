-- CreateTable
CREATE TABLE "Pnode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "address" TEXT NOT NULL,
    "version" TEXT,
    "lastSeen" DATETIME,
    "lastSeenTimestamp" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PnodeStatSample" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pnodeId" INTEGER NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuPercent" REAL,
    "ramUsedBytes" BIGINT,
    "ramTotalBytes" BIGINT,
    "uptimeSeconds" INTEGER,
    "packetsInPerSec" REAL,
    "packetsOutPerSec" REAL,
    "activeStreams" INTEGER,
    "totalBytes" BIGINT,
    "totalPages" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PnodeStatSample_pnodeId_fkey" FOREIGN KEY ("pnodeId") REFERENCES "Pnode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Pnode_address_key" ON "Pnode"("address");
