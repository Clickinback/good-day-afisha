import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CalendarPlus, Clock3, Download, MapPin, Ticket } from "lucide-react";
import { notFound } from "next/navigation";
import { EventSchedule } from "@/components/event-schedule";
import { EventShareActions } from "@/components/event-share-actions";
import { getPublicEvent } from "@/data/events";
import { formatEventDate, formatEventTime, formatPrice } from "@/lib/format";
import { buildEventStructuredData } from "@/lib/event-seo";
import { buildGoogleCalendarUrl, buildIcsDataUrl, buildMapUrl } from "@/lib/event-calendar";
import { buildEventShareText } from "@/lib/event-sharing";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const event = await getPublicEvent(decodeURIComponent(slug));
  if (!event || event.city.slug !== decodeURIComponent(city)) return { title: "Событие не найдено", robots: { index: false, follow: false } };
  return {
    title: event.title,
    description: event.shortDescription,
    alternates: { canonical: `/${event.city.slug}/events/${event.slug}` },
    openGraph: { title: event.title, description: event.shortDescription, type: "article", url: `/${event.city.slug}/events/${event.slug}`, images: [{ url: event.imageUrl, alt: event.title }] },
    twitter: { card: "summary_large_image", title: event.title, description: event.shortDescription, images: [event.imageUrl] },
  };
}

export default async function EventPage({ params }: Props) {
  const route = await params;
  const city = decodeURIComponent(route.city);
  const slug = decodeURIComponent(route.slug);
  const event = await getPublicEvent(slug);
  if (!event || event.city.slug !== city) notFound();

  const jsonLd = buildEventStructuredData(event);
  const eventUrl = new URL(`/${city}/events/${event.slug}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").toString();
  const canPlan = event.status !== "CANCELLED" && event.status !== "FINISHED";
  const shareText = buildEventShareText({ title: event.title, date: formatEventDate(event.startsAt, event.city.timezone), time: event.timeTbd ? undefined : formatEventTime(event.startsAt, event.city.timezone), venue: event.venue, city: event.city.name });

  return (
    <main className="event-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="shell">
        <Link className="back" href={`/${city}`}><ArrowLeft size={18} />Назад к афише</Link>
        <div className="event-detail">
          <div className="detail-image">
            <Image src={event.imageUrl} alt={event.title} fill priority sizes="(max-width: 900px) 100vw, 55vw" />
            <span>{event.category.name}</span>
          </div>
          <div className="detail-copy">
            {event.status === "CANCELLED" ? <div className="event-status">Событие отменено организатором</div> : event.status === "FINISHED" ? <div className="event-status finished">Событие завершено — страница сохранена в архиве</div> : null}
            <div className="eyebrow">{event.city.name}{event.ageRestriction !== "Возраст уточняется" ? ` · ${event.ageRestriction}` : ""}</div>
            <h1>{event.title}</h1>
            <p className="lead">{event.shortDescription}</p>
            <div className="facts">
              <div><CalendarDays /><span><small>Ближайшая дата</small><b>{formatEventDate(event.startsAt, event.city.timezone)}</b></span></div>
              <div><Clock3 /><span><small>Начало</small><b>{event.timeTbd ? "По согласованию" : formatEventTime(event.startsAt, event.city.timezone)}</b></span></div>
              <div><MapPin /><span><small>Место</small><b>{event.venue}</b><a className="fact-link" href={buildMapUrl(event)} target="_blank" rel="noreferrer">{event.address}</a></span></div>
              <div><Ticket /><span><small>Стоимость</small><b>{formatPrice(event.isFree, event.priceMin, event.priceMax)}</b></span></div>
            </div>
            <div className="event-actions">
              {canPlan && event.ticketUrl ? <a className="primary-button" href={event.ticketUrl} target="_blank" rel="noreferrer"><Ticket size={18} />Купить билет</a> : canPlan && event.organizer?.websiteUrl ? <a className="primary-button" href={event.organizer.websiteUrl} target="_blank" rel="noreferrer">Уточнить у организатора</a> : null}
              {canPlan ? <a className="secondary-button" href={buildGoogleCalendarUrl(event, eventUrl)} target="_blank" rel="noreferrer"><CalendarPlus size={18} />В Google Календарь</a> : null}
              {canPlan ? <a className="calendar-download" href={buildIcsDataUrl(event, eventUrl)} download={`${event.slug}.ics`}><Download size={16} />Apple / Outlook</a> : null}
            </div>
            <EventShareActions title={event.title} text={shareText} url={eventUrl} eventSlug={event.slug} />
          </div>
        </div>
        <EventSchedule occurrences={event.occurrences ?? []} isFree={event.isFree} timezone={event.city.timezone} />
        <article className="description">
          <span className="eyebrow coral">О событии</span>
          <h2>Подробности</h2>
          <p>{event.description}</p>
        </article>
      </div>
    </main>
  );
}
