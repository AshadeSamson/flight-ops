import cron from "node-cron";
import syncDailyFlightSchedule from "../services/fidsServices/syncDailyFlightSchedule";

export function startFidsSyncJob() {
  console.log("FIDS Sync Job Initialized");
  let isRunning = false;

  cron.schedule(
    "* * * * *", // 3:00 AM
    async () => {
          if (isRunning) {
            console.log("Previous job still running, skipping...");
            return;
            }

            isRunning = true;
            console.log("Running FIDS sync job...")

      try {
        await syncDailyFlightSchedule();
        isRunning = false;
        console.log("FIDS sync completed");
      } catch (error) {
        console.error("FIDS sync failed:", error);
      }
    },
    {
      timezone: "Africa/Lagos", 
    }
  );
}