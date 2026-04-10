import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { sendEmail } from "../../lib/email";
import crypto from "crypto";
import { getAppUrl } from "../../lib/geturl";

export default async function forgotPassword(req: Request, res: Response) {
    // check if email is provided
    const { email } = req.body as { email?: string };

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        // find user by email
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(404).json({ message: "If an account with this email exists, we will send you a reset link" });
        }

        // generate password reset token
        const rawToken = crypto.randomBytes(32).toString("hex");

        const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

        // save token hash and expiration to user record
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
            },
        });

        // response
        res.status(200).json({ message: "If an account with this email exists, we will send you a reset link" });

        const resetLink = `${getAppUrl()}/password-reset?token=${rawToken}`;

        await sendEmail(
            user.email,
            "Password Reset Request",
            `<p>Hi ${user.name},</p>
             <p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">Reset Password</a>
             <p>This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>`
        );

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }


}