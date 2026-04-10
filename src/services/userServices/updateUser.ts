import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { updateUserSchema } from "../../controllers/users/user.schema";
import { hashPassword } from "../../lib/hash";
import { UserRole } from "@prisma/client";


export default async function updateUser(req: Request, res: Response) {
    const id = req.params.id as string;

    const result = updateUserSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            message: "Invalid input data",
            errors: result.error.flatten().fieldErrors,
        });
    }

    const { email, password, name, role, staffId } = result.data;

    try {
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                email,
                ...(password && { passwordHash: await hashPassword(password) }),
                name,
                role: role as UserRole,
                staffId,
            },
        });

        return res.status(200).json({
            message: "User updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                staffId: updatedUser.staffId,
            },
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}