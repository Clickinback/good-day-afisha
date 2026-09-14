import { endOfDay, endOfWeek, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type EventPeriod = "today" | "tomorrow" | "weekend";

export function eventPeriodRange(period: string | undefined, now = new Date(), timezone = "Europe/Minsk") {
  if (!period) return { from: now, to: undefined };
  const localNow = toZonedTime(now, timezone);
  if (period === "today") return {
    from: fromZonedTime(startOfDay(localNow), timezone),
    to: fromZonedTime(endOfDay(localNow), timezone),
  };
  if (period === "tomorrow") {
    const localTomorrow = new Date(localNow);
    localTomorrow.setDate(localTomorrow.getDate() + 1);
    localTomorrow.setHours(0, 0, 0, 0);
    return {
      from: fromZonedTime(startOfDay(localTomorrow), timezone),
      to: fromZonedTime(endOfDay(localTomorrow), timezone),
    };
  }
  if (period === "weekend") return {
    from: now,
    to: fromZonedTime(endOfWeek(localNow, { weekStartsOn: 1 }), timezone),
  };
  return { from: now, to: undefined };
}
