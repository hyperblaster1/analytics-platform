-- CreateTable
CREATE TABLE "NetworkSnapshot" (
    "id" SERIAL NOT NULL,
    "ingestionRunId" INTEGER NOT NULL,
    "totalNodes" INTEGER NOT NULL,
    "reachableNodes" INTEGER NOT NULL,
    "unreachableNodes" INTEGER NOT NULL,
    "reachablePercent" DOUBLE PRECISION NOT NULL,
    "medianUptimeSeconds" INTEGER NOT NULL,
    "p90UptimeSeconds" INTEGER NOT NULL,
    "totalStorageCommitted" BIGINT NOT NULL,
    "totalStorageUsed" BIGINT NOT NULL,
    "nodesBackedOff" INTEGER NOT NULL,
    "nodesFailingStats" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkVersionStat" (
    "id" SERIAL NOT NULL,
    "networkSnapshotId" INTEGER NOT NULL,
    "ingestionRunId" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "nodeCount" INTEGER NOT NULL,

    CONSTRAINT "NetworkVersionStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkSeedVisibility" (
    "id" SERIAL NOT NULL,
    "networkSnapshotId" INTEGER NOT NULL,
    "ingestionRunId" INTEGER NOT NULL,
    "seedBaseUrl" TEXT NOT NULL,
    "nodesSeen" INTEGER NOT NULL,
    "freshNodes" INTEGER NOT NULL,
    "staleNodes" INTEGER NOT NULL,
    "offlineNodes" INTEGER NOT NULL,

    CONSTRAINT "NetworkSeedVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NetworkCreditsStat" (
    "id" SERIAL NOT NULL,
    "networkSnapshotId" INTEGER NOT NULL,
    "ingestionRunId" INTEGER NOT NULL,
    "medianCredits" INTEGER NOT NULL,
    "p90Credits" INTEGER NOT NULL,

    CONSTRAINT "NetworkCreditsStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkSnapshot_ingestionRunId_key" ON "NetworkSnapshot"("ingestionRunId");

-- CreateIndex
CREATE INDEX "NetworkSnapshot_ingestionRunId_idx" ON "NetworkSnapshot"("ingestionRunId");

-- CreateIndex
CREATE INDEX "NetworkSnapshot_createdAt_idx" ON "NetworkSnapshot"("createdAt");

-- CreateIndex
CREATE INDEX "NetworkVersionStat_ingestionRunId_idx" ON "NetworkVersionStat"("ingestionRunId");

-- CreateIndex
CREATE INDEX "NetworkVersionStat_networkSnapshotId_idx" ON "NetworkVersionStat"("networkSnapshotId");

-- CreateIndex
CREATE INDEX "NetworkSeedVisibility_ingestionRunId_idx" ON "NetworkSeedVisibility"("ingestionRunId");

-- CreateIndex
CREATE INDEX "NetworkSeedVisibility_networkSnapshotId_idx" ON "NetworkSeedVisibility"("networkSnapshotId");

-- CreateIndex
CREATE INDEX "NetworkSeedVisibility_seedBaseUrl_idx" ON "NetworkSeedVisibility"("seedBaseUrl");

-- CreateIndex
CREATE UNIQUE INDEX "NetworkCreditsStat_networkSnapshotId_key" ON "NetworkCreditsStat"("networkSnapshotId");

-- CreateIndex
CREATE INDEX "NetworkCreditsStat_ingestionRunId_idx" ON "NetworkCreditsStat"("ingestionRunId");

-- CreateIndex
CREATE INDEX "NetworkCreditsStat_networkSnapshotId_idx" ON "NetworkCreditsStat"("networkSnapshotId");

-- AddForeignKey
ALTER TABLE "NetworkSnapshot" ADD CONSTRAINT "NetworkSnapshot_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "IngestionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkVersionStat" ADD CONSTRAINT "NetworkVersionStat_networkSnapshotId_fkey" FOREIGN KEY ("networkSnapshotId") REFERENCES "NetworkSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkSeedVisibility" ADD CONSTRAINT "NetworkSeedVisibility_networkSnapshotId_fkey" FOREIGN KEY ("networkSnapshotId") REFERENCES "NetworkSnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NetworkCreditsStat" ADD CONSTRAINT "NetworkCreditsStat_networkSnapshotId_fkey" FOREIGN KEY ("networkSnapshotId") REFERENCES "NetworkSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

