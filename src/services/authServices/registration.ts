import { Request, Response } from "express";
import { registerSchema } from "../../controllers/auth/auth.schema";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../lib/hash";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../lib/email";
import { getAppUrl } from "../../lib/geturl";


export default async function register(req: Request, res: Response) {
    try {

        // req.body validation
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({ 
                message: "Invalid request body", 
                errors: result.error.flatten(),
            });
        }

        const { name, email, password, staffId } = result.data;

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

        // password hashing
        const passwordHash = await hashPassword(password);

        // create user
        const newUser = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                passwordHash,
                isEmailVerified: false,
                role: staffId && staffId.toUpperCase().startsWith("BASL/ID/") ? "STAFF" : "TENANT",
                staffId: staffId ? staffId.toUpperCase() : null,
            },
        });

        // response
        res.status(201).json({ 
            message: "User registered successfully",
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
        console.error(error);
        return res.status(500).json({ 
            message: "Internal server error", 
        });
    }
}