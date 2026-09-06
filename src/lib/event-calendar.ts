import type { Event } from "@/modules/events/types";
import { formatEventDayKey } from "./format";

const pad = (value: number) => String(value).padStart(2, "0");

function utcStamp(value: Date) {
  return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}T${pad(value.getUTCHours())}${pad(value.getUTCMinutes())}${pad(value.getUTCSeconds())}Z`;
}

function dayStamp(value: Date) {
  return `${value.getUTCFullYear()}${pad(value.getUTCMonth() + 1)}${pad(value.getUTCDate())}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function calendarDates(event: Event) {
  const start = new Date(event.startsAt);
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
  if (event.timeTbd) {
    const localDay = formatEventDayKey(event.startsAt, event.city.timezone);
    const [year,month,day] = localDay.split("-").map(Number);
    const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
    const startDay = localDay.replace(/-/g, "");
    return { google: `${startDay}/${dayStamp(nextDay)}`, icsStart: `DTSTART;VALUE=DATE:${startDay}`, icsEnd: `DTEND;VALUE=DATE:${dayStamp(nextDay)}` };
  }
  return { google: `${utcStamp(start)}/${utcStamp(end)}`, icsStart: `DTSTART:${utcStamp(start)}`, icsEnd: `DTEND:${utcStamp(end)}` };
}

export function buildGoogleCalendarUrl(event: Event, eventUrl: string) {
  const dates = calendarDates(event);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: dates.google,
    details: `${event.shortDescription}\n\n${eventUrl}`,
    location: [event.venue, event.address, event.city.name].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function buildIcsDataUrl(event: Event, eventUrl: string) {
  const dates = calendarDates(event);
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Good Day Afisha//RU", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${escapeIcs(`${event.id}@afisha.good-day.by`)}`, `DTSTAMP:${utcStamp(new Date())}`,
    dates.icsStart, dates.icsEnd, `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(`${event.shortDescription}\n\n${eventUrl}`)}`,
    `LOCATION:${escapeIcs([event.venue, event.address, event.city.name].filter(Boolean).join(", "))}`,
    `URL:${escapeIcs(eventUrl)}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(content)}`;
}

export function buildMapUrl(event: Event) {
  const query = [event.venue, event.address, event.city.name].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
