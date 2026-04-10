import { prisma } from "./prisma";

export async function connectToDB() {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        throw error;
    }
}