-- AlterTable
ALTER TABLE "ArchivedDailyOperation" ADD COLUMN     "boardingCall" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "FlightOperation" ADD COLUMN     "boardingCall" TIMESTAMP(3);
