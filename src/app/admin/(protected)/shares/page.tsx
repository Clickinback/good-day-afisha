import Link from "next/link";
import { Eye, Share2, Ticket, TriangleAlert } from "lucide-react";
import { getProductAnalytics } from "@/lib/share-analytics-data";
import { shareChannelLabels, shareChannels } from "@/lib/share-analytics";

const periods = [7, 30, 90] as const;
const number = new Intl.NumberFormat("ru-BY");
const percent = new Intl.NumberFormat("ru-BY", { maximumFractionDigits: 1 });
const dayFormat = new Intl.DateTimeFormat("ru-BY", { day: "numeric", month: "short", timeZone: "UTC" });
const ratio = (actions: number, views: number) => views ? actions / views * 100 : 0;

export default async function SharesPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const rawDays = (await searchParams).days;
  const days = periods.find((value) => String(value) === rawDays) ?? 30;
  let data: Awaited<ReturnType<typeof getProductAnalytics>> | null = null;
  try { data = await getProductAnalytics(days); } catch { /* migration or database is unavailable */ }
  const maxDaily = Math.max(1, ...(data?.daily.flatMap((item) => [item.views, item.shares, item.tickets]) ?? []));

  return <>
    <header className="admin-top"><div><span className="eyebrow coral">Аналитика</span><h1>Интерес к мероприятиям</h1><p>Просмотры и полезные действия без cookies и персональных данных. Показатели отражают действия, а не уникальных людей.</p></div></header>
    {!data ? <div className="admin-notice"><TriangleAlert/><div><b>Статистика пока недоступна</b><p>Проверьте подключение к PostgreSQL и применение миграции.</p></div></div> : <>
      <nav className="analytics-periods" aria-label="Период статистики">{periods.map((period) => <Link className={period === days ? "active" : ""} href={`/admin/shares?days=${period}`} key={period}>{period} дней</Link>)}</nav>
      <div className="engagement-summary">
        <div className="admin-card total"><Eye/><span>Просмотры карточек</span><b>{number.format(data.views)}</b></div>
        <div className="admin-card"><Share2/><span>Поделились</span><b>{number.format(data.totalShares)}</b><small>{percent.format(data.shareRate)}% от просмотров</small></div>
        <div className="admin-card"><Ticket/><span>Переходы за билетами</span><b>{number.format(data.tickets)}</b><small>{percent.format(data.ticketRate)}% от просмотров</small></div>
      </div>
      <section className="admin-card share-chart"><div className="table-toolbar"><b>Динамика по дням</b><span className="chart-legend"><i className="views"/>Просмотры <i className="shares"/>Поделились <i className="tickets"/>Билеты</span></div>{data.daily.length ? <div className="engagement-bars">{data.daily.map((item) => <div key={item.day.toISOString()}><span>{dayFormat.format(item.day)}</span><div><i className="views" style={{ width: `${item.views / maxDaily * 100}%` }}/><i className="shares" style={{ width: `${item.shares / maxDaily * 100}%` }}/><i className="tickets" style={{ width: `${item.tickets / maxDaily * 100}%` }}/></div><strong>{number.format(item.views)} / {number.format(item.shares)} / {number.format(item.tickets)}</strong></div>)}</div> : <div className="table-empty">Данных пока нет. Они появятся после первых просмотров карточек.</div>}</section>
      <section className="admin-card table-card"><div className="table-toolbar"><b>Популярные мероприятия</b><span>{data.events.length}</span></div>{data.events.length ? <div className="admin-table engagement-table"><div className="tr table-head"><span>Мероприятие</span><span>Просмотры</span><span>Поделились</span><span>Билеты</span><span>Доля публикаций</span><span>Доля билетов</span></div>{data.events.map((event) => <div className="tr" key={event.id}><span><b><Link href={`/${event.city.slug}/events/${event.slug}`}>{event.title}</Link></b><small>{event.city.name}</small></span><span><strong>{number.format(event.views)}</strong></span><span>{number.format(event.shares)}</span><span>{number.format(event.tickets)}</span><span>{percent.format(ratio(event.shares, event.views))}%</span><span>{percent.format(ratio(event.tickets, event.views))}%</span></div>)}</div> : <div className="table-empty"><Eye/> Статистика мероприятий пока пуста.</div>}</section>
      <section className="admin-card channel-breakdown"><div className="table-toolbar"><b>Где делятся</b><span>{days} дней</span></div><div>{shareChannels.map((channel) => <p key={channel}><span>{shareChannelLabels[channel]}</span><b>{number.format(data.channelTotals[channel])}</b></p>)}</div></section>
    </>}
  </>;
}
