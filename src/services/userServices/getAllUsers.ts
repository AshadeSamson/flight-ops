import { Request, Response } from "express";
import { prisma } from "../../config/prisma";


export default async function getAllUsers(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          staffId: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where: { deletedAt: null },
      }),
    ]);

    return res.status(200).json({
      users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
}