import Link from "next/link";
import { BarChart3, Share2, TriangleAlert } from "lucide-react";
import { getShareAnalytics } from "@/lib/share-analytics-data";
import { shareChannelLabels, shareChannels } from "@/lib/share-analytics";

const periods = [7, 30, 90] as const;
const number = new Intl.NumberFormat("ru-BY");
const dayFormat = new Intl.DateTimeFormat("ru-BY", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function SharesPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const rawDays = (await searchParams).days;
  const days = periods.find((value) => String(value) === rawDays) ?? 30;
  let data: Awaited<ReturnType<typeof getShareAnalytics>> | null = null;
  try { data = await getShareAnalytics(days); } catch { /* migration or database is unavailable */ }
  const maxDaily = Math.max(1, ...(data?.daily.map((item) => item.count) ?? []));

  return <>
    <header className="admin-top"><div><span className="eyebrow coral">Аналитика</span><h1>Поделились событиями</h1><p>Агрегированная статистика без cookies и персональных данных.</p></div></header>
    {!data ? <div className="admin-notice"><TriangleAlert/><div><b>Статистика пока недоступна</b><p>Проверьте подключение к PostgreSQL и применение миграции.</p></div></div> : <>
      <nav className="analytics-periods" aria-label="Период статистики">{periods.map((period) => <Link className={period === days ? "active" : ""} href={`/admin/shares?days=${period}`} key={period}>{period} дней</Link>)}</nav>
      <div className="share-summary"><div className="admin-card total"><i><Share2/></i><span>Всего</span><b>{number.format(data.total)}</b></div>{shareChannels.map((channel) => <div className="admin-card" key={channel}><span>{shareChannelLabels[channel]}</span><b>{number.format(data.channelTotals[channel])}</b></div>)}</div>
      <section className="admin-card share-chart"><div className="table-toolbar"><b>Динамика по дням</b><span>{days} дней</span></div>{data.daily.length ? <div className="share-bars">{data.daily.map((item) => <div key={item.day.toISOString()}><span>{dayFormat.format(item.day)}</span><i><b style={{ width: `${Math.max(3, item.count / maxDaily * 100)}%` }}/></i><strong>{number.format(item.count)}</strong></div>)}</div> : <div className="table-empty">Нажатий пока нет. Первые данные появятся после публикации ссылки.</div>}</section>
      <section className="admin-card table-card"><div className="table-toolbar"><b>Популярные мероприятия</b><span>{data.events.length}</span></div>{data.events.length ? <div className="admin-table share-table"><div className="tr table-head"><span>Мероприятие</span><span>Всего</span>{shareChannels.map((channel) => <span key={channel}>{shareChannelLabels[channel]}</span>)}</div>{data.events.map((event) => <div className="tr" key={event.id}><span><b><Link href={`/${event.city.slug}/events/${event.slug}`}>{event.title}</Link></b><small>{event.city.name}</small></span><span><strong>{number.format(event.total)}</strong></span>{shareChannels.map((channel) => <span key={channel}>{number.format(event.channels[channel])}</span>)}</div>)}</div> : <div className="table-empty"><BarChart3/> Статистика мероприятий пока пуста.</div>}</section>
    </>}
  </>;
}
