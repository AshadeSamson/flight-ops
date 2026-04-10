import { Request, Response } from "express";
import { loginSchema } from "../../controllers/auth/auth.schema";
import { prisma } from "../../config/prisma";
import { checkPassword } from "../../lib/hash";
import jwt from "jsonwebtoken";

export default async function login(req: Request, res: Response) {
  try {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request body",
        errors: result.error.flatten(),
      });
    }

    const { email, password } = result.data;
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await checkPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
        name: user.name,
        staffId: user.staffId,
      },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        staffId: user.staffId,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}