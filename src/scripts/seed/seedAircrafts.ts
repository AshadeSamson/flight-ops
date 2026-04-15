import { prisma } from "../../config/prisma";

const aircrafts = [
  {
    type: "B733",
    registrationNumber: "5N-BUL",
    maxCapacity: 150,
    airlineCode: "P4",
  },
  {
    type: "E190",
    registrationNumber: "5N-CJM",
    maxCapacity: 114,
    airlineCode: "P4",
  },
  {
    type: "E145",
    registrationNumber: "5N-BUL",
    maxCapacity: 50,
    airlineCode: "P4",
  },
  {
    type: "B738",
    registrationNumber: "OM-NEX",
    maxCapacity: 178,
    airlineCode: "P4",
  },
  {
    type: "B738",
    registrationNumber: "OM-IEX",
    maxCapacity: 178,
    airlineCode: "P4",
  },
  {
    type: "B738",
    registrationNumber: "OM-JEX",
    maxCapacity: 178,
    airlineCode: "P4",
  },
  {
    type: "B738",
    registrationNumber: "OM-OEX",
    maxCapacity: 178,
    airlineCode: "P4",
  },
  {
    type: "B738",
    registrationNumber: "OM-PEX",
    maxCapacity: 178,
    airlineCode: "P4",
  },
  {
    type: "E145",
    registrationNumber: "5N-BWX",
    maxCapacity: 50,
    airlineCode: "UN",
  },
  {
    type: "E145",
    registrationNumber: "5N-BWY",
    maxCapacity: 50,
    airlineCode: "UN",
  },
  {
    type: "E145",
    registrationNumber: "5N-BWZ",
    maxCapacity: 50,
    airlineCode: "UN",
  },
  {
    type: "A320",
    registrationNumber: "LZ-FSD",
    maxCapacity: 180,
    airlineCode: "UN",
  },
  {
    type: "A320",
    registrationNumber: "LZ-FSB",
    maxCapacity: 180,
    airlineCode: "UN",
  },
  {
    type: "A320",
    registrationNumber: "LZ-FSG",
    maxCapacity: 180,
    airlineCode: "UN",
  },
  {
    type: "A320",
    registrationNumber: "LZ-FSJ",
    maxCapacity: 180,
    airlineCode: "UN",
  },
  {
    type: "CRJ 900",
    registrationNumber: "ZS-CAU",
    maxCapacity: 90,
    airlineCode: "UN",
  },
  {
    type: "CRJ 900",
    registrationNumber: "ZS-CMO",
    maxCapacity: 90,
    airlineCode: "UN",
  },
  {
    type: "E190",
    registrationNumber: "UR-EMA",
    maxCapacity: 114,
    airlineCode: "UN",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-BWK",
    maxCapacity: 90,
    airlineCode: "QI",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-CEE",
    maxCapacity: 90,
    airlineCode: "QI",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-BXP",
    maxCapacity: 90,
    airlineCode: "QI",
  },
  {
    type: "A220",
    registrationNumber: "5N-CDA",
    maxCapacity: 160,
    airlineCode: "QI",
  },
  {
    type: "A220",
    registrationNumber: "5N-CDB",
    maxCapacity: 160,
    airlineCode: "QI",
  },
  {
    type: "CRJ 700",
    registrationNumber: "5N-CCK",
    maxCapacity: 78,
    airlineCode: "VK",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-BXT",
    maxCapacity: 90,
    airlineCode: "VK",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-BXS",
    maxCapacity: 90,
    airlineCode: "VK",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-BXR",
    maxCapacity: 90,
    airlineCode: "VK",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-CEX",
    maxCapacity: 90,
    airlineCode: "VK",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-CEY",
    maxCapacity: 90,
    airlineCode: "VK",
  },
  {
    type: "CRJ 900",
    registrationNumber: "5N-CFA",
    maxCapacity: 90,
    airlineCode: "VK",
  },
  {
    type: "CRJ 1000",
    registrationNumber: "5N-CRA",
    maxCapacity: 100,
    airlineCode: "VK",
  },
  {
    type: "CRJ 1000",
    registrationNumber: "5N-CRB",
    maxCapacity: 100,
    airlineCode: "VK",
  },
  {
    type: "E145",
    registrationNumber: "5N-BZX",
    maxCapacity: 50,
    airlineCode: "R4",
  },
  {
    type: "E145",
    registrationNumber: "5N-BZU",
    maxCapacity: 50,
    airlineCode: "R4",
  },
  {
    type: "E145",
    registrationNumber: "5N-BZY",
    maxCapacity: 50,
    airlineCode: "R4",
  },
  {
    type: "DH8H",
    registrationNumber: "5N-CAE",
    maxCapacity: 78,
    airlineCode: "UY",
  },
  {
    type: "DH8H",
    registrationNumber: "5N-CAH",
    maxCapacity: 78,
    airlineCode: "UY",
  },
  {
    type: "DH8H",
    registrationNumber: "5N-CAC",
    maxCapacity: 78,
    airlineCode: "UY",
  },
  {
    type: "CRJ 200",
    registrationNumber: "5N-XEL",
    maxCapacity: 50,
    airlineCode: "4U",
  },
  {
    type: "CRJ 200",
    registrationNumber: "5N-XEJ",
    maxCapacity: 50,
    airlineCode: "4U",
  },
  {
    type: "E145",
    registrationNumber: "5N-BZU",
    maxCapacity: 50,
    airlineCode: "4U",
  },
  {
    type: "E145",
    registrationNumber: "5N-BZZ",
    maxCapacity: 50,
    airlineCode: "4U",
  },
  {
    type: "D8H8",
    registrationNumber: "5N-BKX",
    maxCapacity: 78,
    airlineCode: "W3",
  },
  {
    type: "B737",
    registrationNumber: "5N-MJF",
    maxCapacity: 149,
    airlineCode: "W3",
  },
  {
    type: "B737",
    registrationNumber: "5N-MJQ",
    maxCapacity: 149,
    airlineCode: "W3",
  },
  {
    type: "B735",
    registrationNumber: "5N-BKR",
    maxCapacity: 132,
    airlineCode: "N2",
  },
  {
    type: "B733",
    registrationNumber: "5N-BYR",
    maxCapacity: 150,
    airlineCode: "N2",
  },
  {
    type: "B733",
    registrationNumber: "5N-BYQ",
    maxCapacity: 150,
    airlineCode: "N2",
  },
  {
    type: "E170",
    registrationNumber: "5N-ENU",
    maxCapacity: 78,
    airlineCode: "EE",
  },
  {
    type: "E170",
    registrationNumber: "5N-ENR",
    maxCapacity: 78,
    airlineCode: "EE",
  },
  {
    type: "E190",
    registrationNumber: "5N-ENS",
    maxCapacity: 114,
    airlineCode: "EE",
  },
  {
    type: "E195",
    registrationNumber: "5N-ENO",
    maxCapacity: 122,
    airlineCode: "EE",
  },
  {
    type: "E195",
    registrationNumber: "5N-ENP",
    maxCapacity: 122,
    airlineCode: "EE",
  },
  {
    type: "B733",
    registrationNumber: "5N-BBM",
    maxCapacity: 150,
    airlineCode: "VM",
  },
  {
    type: "B733",
    registrationNumber: "5N-ADB",
    maxCapacity: 150,
    airlineCode: "VM",
  },
  {
    type: "B733",
    registrationNumber: "5N-DAB",
    maxCapacity: 150,
    airlineCode: "VM",
  },
  {
    type: "B733",
    registrationNumber: "5N-DMB",
    maxCapacity: 150,
    airlineCode: "VM",
  },
  {
    type: "B735",
    registrationNumber: "5N-DMK",
    maxCapacity: 132,
    airlineCode: "VM",
  },
  {
    type: "B777",
    registrationNumber: "5N-BBN",
    maxCapacity: 400,
    airlineCode: "VM",
  },
];

	



export default async function seedAircrafts() {
  for (const aircraft of aircrafts) {
    const airline = await prisma.airline.findUnique({
      where: { code: aircraft.airlineCode },
    });

    if (!airline) {
      console.warn(`Airline not found: ${aircraft.airlineCode}`);
      continue;
    }

    await prisma.aircraft.upsert({
      where: { registrationNumber: aircraft.registrationNumber },
      update: {},
      create: {
        type: aircraft.type,
        registrationNumber: aircraft.registrationNumber,
        maxCapacity: aircraft.maxCapacity,
        airlineId: airline.id,
      },
    });
  }

  console.log(" Aircrafts seeded");
}