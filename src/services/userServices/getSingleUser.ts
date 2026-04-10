import { Request, Response } from "express";
import { prisma } from "../../config/prisma";


export default async function getAUser(req: Request, res: Response) {
  const id = req.params.id as string;

  if (!id) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        staffId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({ user });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}