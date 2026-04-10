import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { createUserSchema } from "../../controllers/users/user.schema";
import { hashPassword } from "../../lib/hash";
import { sendEmail } from "../../lib/email";
import jwt from "jsonwebtoken";
import { getAppUrl } from "../../lib/geturl";
import { UserRole } from "@prisma/client";


export default async function createUser(req: Request, res: Response) {
    try {
        const result = createUserSchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({ 
            message: "Invalid request body", 
            errors: result.error.flatten(),
        });
    }

    const { name, email, password, staffId, role } = result.data;

    // email sanitation
    const normalizedEmail = email.trim().toLowerCase();

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
    });

    if (existingUser) {
        return res.status(409).json({ 
            message: "Email is already in use! Please try with a different email", 
        });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                passwordHash,
                isEmailVerified: false,
                role: role as UserRole,
                staffId,
            },
        });

         // response
        res.status(201).json({ 
            message: "User registered successfully. They will receive an email to verify their account.",
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isEmailVerified: newUser.isEmailVerified,
            },
        });

        // email verification token generation
        const verificationToken = jwt.sign({ sub: newUser.id }, process.env.JWT_ACCESS_SECRET!, { expiresIn: "1d" });

        // verification link
        const verificationLink = `${getAppUrl()}/api/auth/verify-email?token=${verificationToken}`;

        // send verification email
        await sendEmail(
            newUser.email,
            "Verify your email address",
            `<p>Hi ${newUser.name},</p>
             <p>Please click the link below to verify your email address:</p>
             <a href="${verificationLink}">Verify Email</a>
             <p>This link will expire in 24 hours.</p>`
        );
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }    
}