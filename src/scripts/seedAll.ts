import seedAirlines from "./seed/seedAirlines";
import seedAirports from "./seed/seedAirports";
import seedBays from "./seed/seedBays";
import seedAircrafts from "./seed/seedAircrafts";

async function run() {
  console.log(" Seeding started...");

  await seedAirlines();
  await seedAirports();
  await seedBays();
  await seedAircrafts();

  console.log(" All seeds completed");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});