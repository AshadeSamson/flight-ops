import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/token";
import { prisma } from "../config/prisma";


async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            return res.status(404).json({ message: "User does not exist" });
        }

        if (user.tokenVersion !== payload.tokenVersion) {
            return res.status(401).json({ message: "Unauthorized: Invalid token version" });
        }

        // Attach user info to request object for downstream handlers
        (req as any).user = {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            isEmailVerified: user.isEmailVerified,
        };


        next();

        
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}


export default requireAuth;