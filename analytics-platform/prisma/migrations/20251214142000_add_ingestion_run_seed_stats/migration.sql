-- CreateTable
CREATE TABLE "IngestionRunSeedStats" (
    "id" SERIAL NOT NULL,
    "ingestionRunId" INTEGER NOT NULL,
    "seedBaseUrl" TEXT NOT NULL,
    "attempted" INTEGER NOT NULL DEFAULT 0,
    "backoff" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "observed" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IngestionRunSeedStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IngestionRunSeedStats_ingestionRunId_seedBaseUrl_key" ON "IngestionRunSeedStats"("ingestionRunId", "seedBaseUrl");

-- CreateIndex
CREATE INDEX "IngestionRunSeedStats_ingestionRunId_idx" ON "IngestionRunSeedStats"("ingestionRunId");

-- CreateIndex
CREATE INDEX "IngestionRunSeedStats_seedBaseUrl_idx" ON "IngestionRunSeedStats"("seedBaseUrl");

-- AddForeignKey
ALTER TABLE "IngestionRunSeedStats" ADD CONSTRAINT "IngestionRunSeedStats_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "IngestionRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

