import { Request, Response } from "express";
import { prisma } from "../../config/prisma";


export default async function getAllUsers(req: Request, res: Response) {
    
    try{
        const users = await prisma.user.findMany({
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isEmailVerified: true,
                staffId: true,
                createdAt: true,
            },
        });

        return res.status(200).json({ users });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}