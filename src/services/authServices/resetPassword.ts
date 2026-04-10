import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../lib/hash";
import crypto from "crypto";


export default async function resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body as { token: string; newPassword: string };

    if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    try {
        const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });
        
        if (!user) {
            return res.status(400).json({ message: "Invalid or expired reset token" });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
                tokenVersion: user.tokenVersion + 1, 
            },
        });

        return res.status(200).json({ message: "Password reset successfully" });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}