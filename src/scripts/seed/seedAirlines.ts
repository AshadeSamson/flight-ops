import { prisma } from "../../config/prisma";

const airlines = [
  { name: "AERO CONTRACTORS", code: "N2" },
  { name: "UMZA AIRLINE", code: "UY" },
  { name: "RANO", code: "R4" },
  { name: "MAXI", code: "VM" },
  { name: "UNITED NIGERIA", code: "UN" },
  { name: "AIR PEACE", code: "P4" },
  { name: "ARIK", code: "W3" },
  { name: "IBOM AIR", code: "QI" },
  { name: "XEJET", code: "4U" },
  { name: "ENUGU AIRLINE", code: "EE" },
  { name: "VALUE JET", code: "VK" },
];

export default async function seedAirlines() {
  for (const airline of airlines) {
    await prisma.airline.upsert({
      where: { code: airline.code },
      update: {},
      create: airline,
    });
  }

  console.log("Airlines seeded");
}