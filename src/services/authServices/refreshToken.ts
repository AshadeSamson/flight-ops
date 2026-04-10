import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { createAccessToken, createRefreshToken, verifyRefreshToken } from "../../lib/token";


export default async function refreshToken(req: Request, res: Response) {
    try {
        const token = req.cookies?.refreshToken as string | undefined;

        if (!token) {
            return res.status(401).json({ message: "Refresh token is missing" });
        }

        const payload = verifyRefreshToken(token);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = createAccessToken(user.id, user.role, user.tokenVersion);
        const newRefreshToken = createRefreshToken(user.id, user.tokenVersion);

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken: newAccessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        })
    } catch (error) {
        console.log(error);

        return res.status(500).json({
        message: "Internal server error",
        });      
    }
}