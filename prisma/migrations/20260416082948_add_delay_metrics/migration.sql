/*
  Warnings:

  - A unique constraint covering the columns `[flightNumber,date,movementType]` on the table `FlightOperation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "FlightOperation_date_idx";

-- AlterTable
ALTER TABLE "FlightOperation" ADD COLUMN     "delayMinutes" INTEGER,
ADD COLUMN     "delayStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "FlightOperation_flightNumber_date_movementType_key" ON "FlightOperation"("flightNumber", "date", "movementType");
