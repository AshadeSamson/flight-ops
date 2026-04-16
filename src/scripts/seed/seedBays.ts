import { prisma } from "../../config/prisma";

const bays = [
  { name: "ALPHA 1", code: "A1" },
  { name: "ALPHA 2", code: "A2" },
  { name: "ALPHA 3", code: "A3" },
  { name: "ALPHA 4", code: "A4" },
  { name: "ALPHA 5", code: "A5" },
  { name: "ALPHA 6", code: "A6" },
  { name: "BRAVO 1", code: "B1" },
  { name: "BRAVO 2", code: "B2" },
  { name: "BRAVO 3", code: "B3" },
  { name: "BRAVO 4", code: "B4" },
  { name: "BRAVO 5", code: "B5" },
  { name: "BRAVO 6", code: "B6" },
  { name: "BRAVO 7", code: "B7" },
  { name: "BRAVO 8", code: "B8" },
  { name: "ENTRANCE", code: "ENT" },
  { name: "EXIT", code: "EXT" },
  { name: "TAKI LANE 1", code: "TXL 1" },
  { name: "TAXI LANE 2", code: "TXL 2" },
  { name: "TAXI LANE 3", code: "TXL 3" },
  { name: "TAXI LANE 4", code: "TXL 4" },
  { name: "ARIK HANGER", code: "ARH" },
  { name: "AERO HANGER", code: "ACN" },
  { name: "GENERAL AVIATION TERMINAL", code: "GAT" }
];


export default async function seedBays() {
  for (const bay of bays) {
    await prisma.bay.upsert({
      where: { code: bay.code },
      update: {},
      create: bay,
    });
  }

  console.log("✅ Bays seeded");
}