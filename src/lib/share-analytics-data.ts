import "server-only";
import type { EngagementAction, ShareChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { EngagementActionInput } from "@/lib/event-engagement";
import { shareMetricDay, type ShareChannelInput } from "@/lib/share-analytics";

const dbChannel: Record<ShareChannelInput, ShareChannel> = {
  native: "NATIVE",
  telegram: "TELEGRAM",
  vk: "VK",
  copy: "COPY",
};

const dbAction: Record<EngagementActionInput, EngagementAction> = {
  view: "VIEW",
  ticket: "TICKET",
};

const emptyChannels = (): Record<ShareChannelInput, number> => ({ native: 0, telegram: 0, vk: 0, copy: 0 });
const emptyActions = (): Record<EngagementActionInput, number> => ({ view: 0, ticket: 0 });

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

export async function recordEventEngagement(slug: string, action: EngagementActionInput) {
  const event = await prisma.event.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FINISHED", "CANCELLED"] } },
    select: { id: true },
  });
  if (!event) return false;
  const day = shareMetricDay();
  const actionValue = dbAction[action];
  await prisma.$transaction([
    prisma.eventEngagementMetric.upsert({
      where: { eventId_action_day: { eventId: event.id, action: actionValue, day } },
      create: { eventId: event.id, action: actionValue, day },
      update: { count: { increment: 1 } },
    }),
    ...(action === "view" ? [prisma.event.update({ where: { id: event.id }, data: { viewCount: { increment: 1 } } })] : []),
  ]);
  return true;
}

export async function getProductAnalytics(days: 7 | 30 | 90) {
  const from = shareMetricDay(new Date(Date.now() - (days - 1) * 86_400_000));
  const where = { day: { gte: from } };
  const [channelRows, shareEventRows, shareDailyRows, actionRows, engagementEventRows, engagementDailyRows] = await Promise.all([
    prisma.eventShareMetric.groupBy({ by: ["channel"], where, _sum: { count: true } }),
    prisma.eventShareMetric.groupBy({ by: ["eventId"], where, _sum: { count: true } }),
    prisma.eventShareMetric.groupBy({ by: ["day"], where, _sum: { count: true }, orderBy: { day: "asc" } }),
    prisma.eventEngagementMetric.groupBy({ by: ["action"], where, _sum: { count: true } }),
    prisma.eventEngagementMetric.groupBy({ by: ["eventId", "action"], where, _sum: { count: true } }),
    prisma.eventEngagementMetric.groupBy({ by: ["day", "action"], where, _sum: { count: true }, orderBy: { day: "asc" } }),
  ]);
  const eventIds = [...new Set([...shareEventRows.map((row) => row.eventId), ...engagementEventRows.map((row) => row.eventId)])];
  const [events, eventChannels] = await Promise.all([
    prisma.event.findMany({ where: { id: { in: eventIds } }, select: { id: true, slug: true, title: true, city: { select: { slug: true, name: true } } } }),
    prisma.eventShareMetric.groupBy({ by: ["eventId", "channel"], where: { ...where, eventId: { in: eventIds } }, _sum: { count: true } }),
  ]);
  const eventById = new Map(events.map((event) => [event.id, event]));
  const channelsByEvent = new Map<string, Record<ShareChannelInput, number>>();
  const actionsByEvent = new Map<string, Record<EngagementActionInput, number>>();
  for (const eventId of eventIds) {
    channelsByEvent.set(eventId, emptyChannels());
    actionsByEvent.set(eventId, emptyActions());
  }
  for (const row of eventChannels) channelsByEvent.get(row.eventId)![row.channel.toLowerCase() as ShareChannelInput] = row._sum.count ?? 0;
  for (const row of engagementEventRows) actionsByEvent.get(row.eventId)![row.action.toLowerCase() as EngagementActionInput] = row._sum.count ?? 0;
  const channelTotals = emptyChannels();
  const actionTotals = emptyActions();
  for (const row of channelRows) channelTotals[row.channel.toLowerCase() as ShareChannelInput] = row._sum.count ?? 0;
  for (const row of actionRows) actionTotals[row.action.toLowerCase() as EngagementActionInput] = row._sum.count ?? 0;
  const totalShares = Object.values(channelTotals).reduce((sum, count) => sum + count, 0);
  const daily = new Map<string, { day: Date; views: number; shares: number; tickets: number }>();
  for (const row of shareDailyRows) daily.set(row.day.toISOString(), { day: row.day, views: 0, shares: row._sum.count ?? 0, tickets: 0 });
  for (const row of engagementDailyRows) {
    const key = row.day.toISOString();
    const item = daily.get(key) ?? { day: row.day, views: 0, shares: 0, tickets: 0 };
    item[row.action === "VIEW" ? "views" : "tickets"] = row._sum.count ?? 0;
    daily.set(key, item);
  }

  return {
    days,
    views: actionTotals.view,
    tickets: actionTotals.ticket,
    totalShares,
    shareRate: actionTotals.view ? totalShares / actionTotals.view * 100 : 0,
    ticketRate: actionTotals.view ? actionTotals.ticket / actionTotals.view * 100 : 0,
    channelTotals,
    events: eventIds.flatMap((eventId) => {
      const event = eventById.get(eventId);
      if (!event) return [];
      const channels = channelsByEvent.get(eventId)!;
      const actions = actionsByEvent.get(eventId)!;
      const shares = Object.values(channels).reduce((sum, count) => sum + count, 0);
      return [{ ...event, channels, shares, views: actions.view, tickets: actions.ticket }];
    }).sort((a, b) => b.views - a.views || b.shares - a.shares || b.tickets - a.tickets).slice(0, 20),
    daily: [...daily.values()].sort((a, b) => a.day.getTime() - b.day.getTime()),
  };
}
