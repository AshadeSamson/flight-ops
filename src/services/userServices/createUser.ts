import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { createUserSchema } from "../../controllers/users/user.schema";
import { hashPassword } from "../../lib/hash";



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

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedStaffId = staffId.toUpperCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already in use!",
      });
    }

    const existingStaff = await prisma.user.findUnique({
      where: { staffId: normalizedStaffId },
    });

    if (existingStaff) {
      return res.status(409).json({
        message: "Staff ID already exists",
      });
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        role,
        staffId: normalizedStaffId,
      },
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        staffId: newUser.staffId,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}