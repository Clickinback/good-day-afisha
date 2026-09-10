import "server-only";
import type { ShareChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { shareMetricDay, type ShareChannelInput } from "@/lib/share-analytics";

const dbChannel: Record<ShareChannelInput, ShareChannel> = {
  native: "NATIVE",
  telegram: "TELEGRAM",
  vk: "VK",
  copy: "COPY",
};

export async function recordEventShare(slug: string, channel: ShareChannelInput) {
  const event = await prisma.event.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FINISHED", "CANCELLED"] } },
    select: { id: true },
  });
  if (!event) return false;
  const day = shareMetricDay();
  const channelValue = dbChannel[channel];
  await prisma.eventShareMetric.upsert({
    where: { eventId_channel_day: { eventId: event.id, channel: channelValue, day } },
    create: { eventId: event.id, channel: channelValue, day },
    update: { count: { increment: 1 } },
  });
  return true;
}

export async function getShareAnalytics(days: 7 | 30 | 90) {
  const from = shareMetricDay(new Date(Date.now() - (days - 1) * 86_400_000));
  const where = { day: { gte: from } };
  const [channelRows, eventTotals, dailyRows] = await Promise.all([
    prisma.eventShareMetric.groupBy({ by: ["channel"], where, _sum: { count: true } }),
    prisma.eventShareMetric.groupBy({ by: ["eventId"], where, _sum: { count: true }, orderBy: { _sum: { count: "desc" } }, take: 20 }),
    prisma.eventShareMetric.groupBy({ by: ["day"], where, _sum: { count: true }, orderBy: { day: "asc" } }),
  ]);
  const eventIds = eventTotals.map((row) => row.eventId);
  const [events, eventChannels] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: eventIds } }, select: { id: true, slug: true, title: true, city: { select: { slug: true, name: true } } } }),
    prisma.eventShareMetric.groupBy({ by: ["eventId", "channel"], where: { ...where, eventId: { in: eventIds } }, _sum: { count: true } }),
  ]);
  const eventById = new Map(events.map((event) => [event.id, event]));
  const channelsByEvent = new Map<string, Record<ShareChannelInput, number>>();
  for (const eventId of eventIds) channelsByEvent.set(eventId, { native: 0, telegram: 0, vk: 0, copy: 0 });
  for (const row of eventChannels) channelsByEvent.get(row.eventId)![row.channel.toLowerCase() as ShareChannelInput] = row._sum.count ?? 0;
  const channelTotals = { native: 0, telegram: 0, vk: 0, copy: 0 } satisfies Record<ShareChannelInput, number>;
  for (const row of channelRows) channelTotals[row.channel.toLowerCase() as ShareChannelInput] = row._sum.count ?? 0;

  return {
    days,
    total: Object.values(channelTotals).reduce((sum, count) => sum + count, 0),
    channelTotals,
    events: eventTotals.flatMap((row) => {
      const event = eventById.get(row.eventId);
      return event ? [{ ...event, total: row._sum.count ?? 0, channels: channelsByEvent.get(row.eventId)! }] : [];
    }),
    daily: dailyRows.map((row) => ({ day: row.day, count: row._sum.count ?? 0 })),
  };
}
