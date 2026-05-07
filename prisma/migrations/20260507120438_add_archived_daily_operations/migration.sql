-- CreateTable
CREATE TABLE "ArchivedDailyOperation" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "movementType" "MovementType" NOT NULL,
    "airlineCode" TEXT,
    "airportName" TEXT NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "operationId" TEXT,
    "soulsOnBoard" INTEGER,
    "actualTime" TIMESTAMP(3),
    "aircraftReg" TEXT,
    "aircraftType" TEXT,
    "bayName" TEXT,
    "delayMinutes" INTEGER,
    "delayStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchivedDailyOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchivedDailyOperation_snapshotDate_idx" ON "ArchivedDailyOperation"("snapshotDate");
