import { Request, Response } from "express";
import { loginSchema } from "../../controllers/auth/auth.schema";
import { prisma } from "../../config/prisma";
import { checkPassword } from "../../lib/hash";
import { createAccessToken, createRefreshToken } from "../../lib/token";

export default async function login(req: Request, res: Response) {
    try {

        // req body validation
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ 
                message: "Invalid request body", 
                errors: result.error.flatten(),
            });
        }


        // email sanitation
        const { email, password } = result.data;
        const normalizedEmail = email.trim().toLowerCase();

        // find user
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // validate password
        const isPasswordValid = await checkPassword(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }


        // check if email is verified
        if (!user.isEmailVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }


        // generate access token
        const accessToken = createAccessToken(user.id, user.role, user.tokenVersion);

        // generate refresh token
        const refreshToken = createRefreshToken(user.id, user.tokenVersion);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // response
        return res.status(200).json({ 
            message: "Login successful",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isEmailVerified: user.isEmailVerified,
            },
        });
        
    } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });    
    }
}