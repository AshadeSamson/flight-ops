import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { forgotPasswordSchema } from "../../controllers/auth/auth.schema";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../lib/email";
import { getAppUrl } from "../../lib/geturl";

export default async function forgotPassword(req: Request, res: Response) {
  try {
    const result = forgotPasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const { email } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    // Always return same response
    if (!user) {
      return res.status(200).json({
        message: "If the account exists, a reset link has been sent",
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        type: "password-reset",
      },
      process.env.JWT_RESET_SECRET!,
      { expiresIn: "15m" }
    );

    const resetLink = `${getAppUrl()}/reset-password?token=${token}`;

    sendEmail(
      user.email,
      "Password Reset",
      `<p>Hi ${user.name},</p>
       <p>Click the link below to reset your password:</p>
       <a href="${resetLink}">Reset Password</a>
       <p>This link expires in 15 minutes.</p>`
    ).catch(console.error);

    return res.status(200).json({
      message: "If the account exists, a reset link has been sent",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}