import getNormalizedFidsData from "../services/fidsServices/getNormalizedFidsData";
import { configDotenv } from "dotenv";

configDotenv();

async function run() {
  const data = await getNormalizedFidsData();

  console.log("Normalized Flights:");
  console.log(data.slice(0, 5)); // preview first 5
}

run().catch(console.error);