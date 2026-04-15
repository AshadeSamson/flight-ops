import { prisma } from "../../config/prisma";

const airports = [
  { name: "LAGOS", code: "LOS" },
  { name: "ABUJA", code: "ABV" },
  { name: "PORT HARCOURT", code: "PHC" },
  { name: "BENIN", code: "BNI" },
  { name: "CALABAR", code: "CBQ" },
  { name: "ENUGU", code: "ENU" },
  { name: "JOS", code: "JOS" },
  { name: "KADUNA", code: "KAD" },
  { name: "KANO", code: "KAN" },
  { name: "WARRI", code: "QRW" },
  { name: "SOKOTO", code: "SKO" },
  { name: "OWERRI", code: "QOW" },
  { name: "AKWA IBOM", code: "QUO" },
  { name: "ASABA", code: "ABB" },
  { name: "ILORIN", code: "ILR" },
  { name: "MAIDUGURI", code: "MIU" },
  { name: "EKITI", code: "EKK" },
];


export default async function seedAirports() {
  for (const airport of airports) {
    await prisma.airport.upsert({
      where: { code: airport.code },
      update: {},
      create: airport,
    });
  }

  console.log("✅ Airports seeded");
}