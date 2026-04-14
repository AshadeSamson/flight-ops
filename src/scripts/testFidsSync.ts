import { configDotenv } from "dotenv";
import syncDailyFlightSchedule from "../services/fidsServices/syncDailyFlightSchedule";

configDotenv();


async function run() {
  await syncDailyFlightSchedule();
}

run()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });