const LAGOS_TIME_ZONE = "Africa/Lagos";

process.env.TZ = process.env.TZ || LAGOS_TIME_ZONE;

export function getLagosDayAnchor(value: Date | string = new Date()): Date {
  const date = value instanceof Date ? value : new Date(value);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

export function getNextLagosDayAnchor(value: Date | string = new Date()): Date {
  const nextDay = getLagosDayAnchor(value);
  nextDay.setDate(nextDay.getDate() + 1);

  return nextDay;
}

export function getLagosDateRange(value: Date | string = new Date()) {
  const startOfDay = getLagosDayAnchor(value);
  const endOfDay = getNextLagosDayAnchor(startOfDay);

  return {
    startOfDay,
    endOfDay,
  };
}

export function parseLagosDateOnly(value: string): Date {
  const cleanDate = String(value).trim();
  const dateMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!dateMatch) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3])
  );
}
