import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import jwt from "jsonwebtoken";

export default async function verifyEmail(req: Request, res: Response) {

    const token = req.query.token as string | undefined;

    if (!token) {
        return res.status(400).json({ message: "Verification token is missing" });
    }

    try {
        
        // verify token
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as { sub: string };

        // find user
        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // update user's email verification status
        await prisma.user.update({
            where: { id: payload.sub },
            data: { isEmailVerified: true },
        });

        return res.status(200).json({ message: "Email verified successfully! You can now login" });
    } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
    });
    }
    
}