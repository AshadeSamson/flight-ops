export function buildScheduledDateTime(
  date: Date,
  time: string
): Date {
  const [hours, minutes, seconds] = time.split(":").map(Number);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds
  );
}


export function calculateDelayMinutes(
  scheduled: Date,
  actual?: Date | null
): number | null {
  if (!actual) return null;

  const actualLagos = new Date(
    actual.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );

  const diffMs = actualLagos.getTime() - scheduled.getTime();

  return Math.round(diffMs / (1000 * 60)); // minutes
}


export function getDelayStatus(delay: number | null) {
  if (delay === null) return "PENDING";

  if (delay <= 0) return "ON_TIME";

  if (delay <= 15) return "MINOR_DELAY";

  return "DELAYED";
}