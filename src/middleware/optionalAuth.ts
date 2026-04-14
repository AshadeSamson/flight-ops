import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/token";
import { prisma } from "../config/prisma";

/**
 * Optional authentication middleware
 * Attempts to authenticate if Authorization header is present
 * Continues without error if no token or token is invalid
 * Sets req.user if authentication is successful
 */
async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // If no auth header, continue without setting user
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyAccessToken(token);

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            // User not found, continue without setting req.user
            return next();
        }

        // if (user.tokenVersion !== payload.tokenVersion) {
        //     // Token version mismatch, continue without setting req.user
        //     return next();
        // }

        // Attach user info to request object for downstream handlers
        (req as any).user = {
            id: user.id,
            role: user.role,
            email: user.email,
            name: user.name,
            // isEmailVerified: user.isEmailVerified,
        };

        next();
    } catch (error) {
        // Token verification failed, continue without setting req.user
        next();
    }
}

export default optionalAuth;
