import { Request, Response } from "express";
import { resetPasswordSchema } from "../../controllers/auth/auth.schema";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { hashPassword } from "../../lib/hash";

export default async function resetPassword(req: Request, res: Response) {
  try {
    const result = resetPasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const { token, password } = result.data;

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET!);
    } catch (err) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    if (decoded.type !== "password-reset") {
      return res.status(400).json({
        message: "Invalid token",
      });
    }

    const userId = decoded.sub;

    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}