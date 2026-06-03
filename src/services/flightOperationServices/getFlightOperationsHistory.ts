import { prisma } from "../../config/prisma";
import {
  getNextLagosDayAnchor,
  parseLagosDateOnly,
} from "../../utils/lagosDate";

export default async function getFlightOperationsHistory(
  params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: string | number;
    movementType?: "ARRIVAL" | "DEPARTURE";
    airlineCode?: string;
    status?: string;
    search?: string;
  }
) {
  const {
    startDate,
    endDate,
    movementType,
    airlineCode,
    status,
    search,
  } = params;

  let page = Number(params.page) || 1;

  //  Safe pagination defaults
  const fetchAll =
    String(params.limit ?? "20").trim().toLowerCase() === "all";

  page = Number(page) || 1;

  if (page < 1) page = 1;

  const numericLimit = fetchAll
    ? undefined
    : Number(params.limit) || 20;

  if (
    numericLimit !== undefined &&
    numericLimit < 1
  ) {
    throw new Error(
      "limit must be greater than 0"
    );
  }

  const skip =
    numericLimit !== undefined
      ? (page - 1) * numericLimit
      : 0;

  const start = parseLagosDateOnly(startDate);

  const end = getNextLagosDayAnchor(parseLagosDateOnly(endDate));

  const where: any = {
    date: {
      gte: start,
      lt: end,
    },
  };

  if (movementType) {
    where.movementType = movementType;
  }

  if (status) {
    where.delayStatus =
      status.toUpperCase();
  }

  if (airlineCode) {
    where.airline = {
      code: airlineCode
        .trim()
        .toUpperCase(),
    };
  }

  if (search) {
    where.OR = [
      {
        flightNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const total =
    await prisma.flightOperation.count({
      where,
    });

  const data =
    await prisma.flightOperation.findMany({
      where,
      include: {
        airline: true,
        aircraft: true,
        bay: true,
        airport: true,
      },
      orderBy: {
        date: "desc",
      },
      skip,
      take: numericLimit,
    });

  const totalPages =
    numericLimit === undefined
      ? 1
      : total === 0
      ? 1
      : Math.ceil(total / numericLimit);

  const paginated =
    numericLimit === undefined
      ? data
      : data.slice(skip, skip + numericLimit);

  return {
    data: paginated,
    meta: {
      total,
      page,
      limit:
        numericLimit === undefined
          ? "all"
          : numericLimit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
