-- CreateTable
CREATE TABLE "Seed" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "baseUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pnode" (
    "id" SERIAL NOT NULL,
    "pubkey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reachable" BOOLEAN NOT NULL DEFAULT false,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastStatsAttemptAt" TIMESTAMP(3),
    "lastStatsSuccessAt" TIMESTAMP(3),
    "nextStatsAllowedAt" TIMESTAMP(3),
    "latestCredits" INTEGER,
    "creditsUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "Pnode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PnodeGossipObservation" (
    "id" SERIAL NOT NULL,
    "seedId" INTEGER NOT NULL,
    "pnodeId" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "version" TEXT,
    "lastSeenTimestamp" BIGINT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PnodeGossipObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PnodeStatsSample" (
    "id" SERIAL NOT NULL,
    "pnodeId" INTEGER NOT NULL,
    "seedId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cpuPercent" DOUBLE PRECISION,
    "ramUsedBytes" BIGINT,
    "ramTotalBytes" BIGINT,
    "uptimeSeconds" INTEGER,
    "packetsInPerSec" DOUBLE PRECISION,
    "packetsOutPerSec" DOUBLE PRECISION,
    "packetsReceivedCumulative" BIGINT,
    "packetsSentCumulative" BIGINT,
    "totalBytes" BIGINT,
    "activeStreams" INTEGER,
    "deltaBytes" BIGINT,
    "deltaSeconds" INTEGER,
    "bytesPerSecond" DOUBLE PRECISION,

    CONSTRAINT "PnodeStatsSample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodCreditsSnapshot" (
    "id" SERIAL NOT NULL,
    "podPubkey" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seedId" INTEGER,

    CONSTRAINT "PodCreditsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" SERIAL NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "seedId" INTEGER,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "backoff" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Seed_baseUrl_key" ON "Seed"("baseUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Pnode_pubkey_key" ON "Pnode"("pubkey");

-- CreateIndex
CREATE INDEX "PnodeGossipObservation_pnodeId_idx" ON "PnodeGossipObservation"("pnodeId");

-- CreateIndex
CREATE INDEX "PnodeGossipObservation_seedId_idx" ON "PnodeGossipObservation"("seedId");

-- CreateIndex
CREATE INDEX "PnodeGossipObservation_observedAt_idx" ON "PnodeGossipObservation"("observedAt");

-- CreateIndex
CREATE INDEX "PnodeStatsSample_pnodeId_idx" ON "PnodeStatsSample"("pnodeId");

-- CreateIndex
CREATE INDEX "PnodeStatsSample_seedId_idx" ON "PnodeStatsSample"("seedId");

-- CreateIndex
CREATE INDEX "PnodeStatsSample_timestamp_idx" ON "PnodeStatsSample"("timestamp");

-- CreateIndex
CREATE INDEX "PodCreditsSnapshot_podPubkey_observedAt_idx" ON "PodCreditsSnapshot"("podPubkey", "observedAt");

-- CreateIndex
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");

-- CreateIndex
CREATE INDEX "IngestionRun_seedId_idx" ON "IngestionRun"("seedId");

-- AddForeignKey
ALTER TABLE "PnodeGossipObservation" ADD CONSTRAINT "PnodeGossipObservation_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PnodeGossipObservation" ADD CONSTRAINT "PnodeGossipObservation_pnodeId_fkey" FOREIGN KEY ("pnodeId") REFERENCES "Pnode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PnodeStatsSample" ADD CONSTRAINT "PnodeStatsSample_pnodeId_fkey" FOREIGN KEY ("pnodeId") REFERENCES "Pnode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PnodeStatsSample" ADD CONSTRAINT "PnodeStatsSample_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
