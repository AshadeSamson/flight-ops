import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { updateUserSchema } from "../../controllers/users/user.schema";
import { hashPassword } from "../../lib/hash";



export default async function updateUser(req: Request, res: Response) {
  const id = req.params.id as string;

  const result = updateUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid input data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, password, name, role, staffId } = result.data;

  try {
    const existingUser = await prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!existingUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let normalizedEmail: string | undefined;
    let normalizedStaffId: string | undefined;

    // email check
    if (email) {
      normalizedEmail = email.trim().toLowerCase();

      const existingEmail = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id },
        },
      });

      if (existingEmail) {
        return res.status(409).json({
          message: "Email is already in use",
        });
      }
    }

    // staffId check
    if (staffId) {
      normalizedStaffId = staffId.toUpperCase();

      const existingStaff = await prisma.user.findFirst({
        where: {
          staffId: normalizedStaffId,
          NOT: { id },
        },
      });

      if (existingStaff) {
        return res.status(409).json({
          message: "Staff ID already exists",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(normalizedEmail && { email: normalizedEmail }),
        ...(name && { name }),
        ...(role && { role }),
        ...(normalizedStaffId && { staffId: normalizedStaffId }),
        ...(password && { passwordHash: await hashPassword(password) }),
      },
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        staffId: updatedUser.staffId,
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}