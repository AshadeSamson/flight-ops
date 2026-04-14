import { PrismaClient, UserRole } from "@prisma/client";
import { hashPassword } from "../src/lib/hash";
import dotenv from "dotenv";

dotenv.config();

console.log("DB URL:", process.env.DATABASE_URL);


const prisma = new PrismaClient();


async function main() {
  const adminEmail = "softwareteam@mma2.ng";
  const adminPassword = "Admin@123"; // change later
  const adminStaffId = "BASL/ID/00000001";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin user already exists");
    return;
  }

  const passwordHash = await hashPassword(adminPassword);

  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      staffId: adminStaffId,
    },
  });

  console.log("Admin user created:");
  console.log({
    email: admin.email,
    password: adminPassword,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });