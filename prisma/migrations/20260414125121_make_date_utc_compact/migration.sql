/*
  Warnings:

  - Made the column `airportName` on table `DailyFlightSchedule` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `date` on the `DailyFlightSchedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "DailyFlightSchedule" ALTER COLUMN "airportName" SET NOT NULL,
DROP COLUMN "date",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "DailyFlightSchedule_date_idx" ON "DailyFlightSchedule"("date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyFlightSchedule_flightNumber_date_movementType_key" ON "DailyFlightSchedule"("flightNumber", "date", "movementType");
