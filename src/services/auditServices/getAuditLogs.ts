import { prisma } from "../../config/prisma";

export default async function getAuditLogs(
  params: {
    page?: number;
    limit?: number;

    module?: string;
    action?: string;

    userId?: string;

    startDate?: string;
    endDate?: string;

    search?: string;
  }
) {
  const {
    module,
    action,
    userId,
    startDate,
    endDate,
    search,
  } = params;

  let page =
    Number(params.page) || 1;

  let limit =
    Number(params.limit) || 20;

  if (page < 1) page = 1;

  if (limit < 1) limit = 20;

  const skip = (page - 1) * limit;

  const where: any = {};

  // Module filter
  if (module) {
    where.module =
      module.toUpperCase();
  }

  // Action filter
  if (action) {
    where.action =
      action.toUpperCase();
  }

  // User filter
  if (userId) {
    where.userId = userId;
  }

  // Date range filter
  if (startDate && endDate) {
    const [
      startYear,
      startMonth,
      startDay,
    ] = startDate
      .split("-")
      .map(Number);

    const [
      endYear,
      endMonth,
      endDay,
    ] = endDate
      .split("-")
      .map(Number);

    const start = new Date(
      Date.UTC(
        startYear,
        startMonth - 1,
        startDay,
        -1,
        0,
        0
      )
    );

    const end = new Date(
      Date.UTC(
        endYear,
        endMonth - 1,
        endDay + 1,
        -1,
        0,
        0
      )
    );

    where.createdAt = {
      gte: start,
      lt: end,
    };
  }

  //  Search filter
  if (search) {
    where.OR = [
      {
        description: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const total =
    await prisma.auditLog.count({
      where,
    });

  const data =
    await prisma.auditLog.findMany({
      where,

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: limit,
    });

  return {
    data,

    meta: {
      total,

      page,

      limit,

      totalPages:
        total === 0
          ? 1
          : Math.ceil(
              total / limit
            ),

      hasNextPage:
        skip + limit < total,

      hasPrevPage:
        page > 1,
    },
  };
}