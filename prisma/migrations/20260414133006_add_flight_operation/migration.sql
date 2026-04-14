/*
  Warnings:

  - You are about to drop the column `aircraftType` on the `FlightOperation` table. All the data in the column will be lost.
  - You are about to drop the column `airlineCode` on the `FlightOperation` table. All the data in the column will be lost.
  - You are about to drop the column `airlineName` on the `FlightOperation` table. All the data in the column will be lost.
  - You are about to drop the column `airportCode` on the `FlightOperation` table. All the data in the column will be lost.
  - You are about to drop the column `airportName` on the `FlightOperation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `FlightOperation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedById` on the `FlightOperation` table. All the data in the column will be lost.
  - Made the column `scheduledTime` on table `FlightOperation` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "FlightOperation_flightNumber_date_movementType_key";

-- AlterTable
ALTER TABLE "FlightOperation" DROP COLUMN "aircraftType",
DROP COLUMN "airlineCode",
DROP COLUMN "airlineName",
DROP COLUMN "airportCode",
DROP COLUMN "airportName",
DROP COLUMN "status",
DROP COLUMN "updatedById",
ALTER COLUMN "scheduledTime" SET NOT NULL,
ALTER COLUMN "scheduledTime" SET DATA TYPE TEXT,
ALTER COLUMN "createdById" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "FlightOperation_date_idx" ON "FlightOperation"("date");

-- AddForeignKey
ALTER TABLE "FlightOperation" ADD CONSTRAINT "FlightOperation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
