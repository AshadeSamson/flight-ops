-- CreateTable
CREATE TABLE "DailyFlightSchedule" (
    "id" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "airlineCode" TEXT NOT NULL,
    "airlineName" TEXT,
    "movementType" "MovementType" NOT NULL,
    "airportCode" TEXT NOT NULL,
    "airportName" TEXT,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyFlightSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyFlightSchedule_date_idx" ON "DailyFlightSchedule"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyFlightSchedule_flightNumber_date_movementType_key" ON "DailyFlightSchedule"("flightNumber", "date", "movementType");
