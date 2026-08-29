import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Ticket } from "lucide-react";
import { notFound } from "next/navigation";
import { EventSchedule } from "@/components/event-schedule";
import { getPublicEvent } from "@/data/events";
import { formatEventDate, formatEventTime, formatPrice } from "@/lib/format";

type Props = { params: Promise<{ city: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getPublicEvent(decodeURIComponent(slug));
  return event ? {
    title: event.title,
    description: event.shortDescription,
    alternates: { canonical: `/${event.city.slug}/events/${event.slug}` },
    openGraph: { title: event.title, description: event.shortDescription, images: [event.imageUrl] },
  } : { title: "Событие не найдено" };
}

export default async function EventPage({ params }: Props) {
  const route = await params;
  const city = decodeURIComponent(route.city);
  const slug = decodeURIComponent(route.slug);
  const event = await getPublicEvent(slug);
  if (!event || event.city.slug !== city) notFound();

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Event", name: event.title,
    description: event.shortDescription, image: [event.imageUrl], startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus: event.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: { "@type": "Place", name: event.venue, address: { "@type": "PostalAddress", streetAddress: event.address, addressLocality: event.city.name, addressCountry: "BY" } },
    offers: { "@type": "Offer", price: event.priceMin ?? 0, priceCurrency: "BYN", url: event.ticketUrl ?? `/${city}/events/${slug}`, availability: "https://schema.org/InStock" },
  };

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
              <div><CalendarDays /><span><small>Ближайшая дата</small><b>{formatEventDate(event.startsAt)}</b></span></div>
              <div><Clock3 /><span><small>Начало</small><b>{event.timeTbd ? "По согласованию" : formatEventTime(event.startsAt)}</b></span></div>
              <div><MapPin /><span><small>Место</small><b>{event.venue}</b><em>{event.address}</em></span></div>
              <div><Ticket /><span><small>Стоимость</small><b>{formatPrice(event.isFree, event.priceMin, event.priceMax)}</b></span></div>
            </div>
            {event.ticketUrl ? <a className="primary-button" href={event.ticketUrl}>Купить билет</a> : <span className="primary-button muted">Уточнить у организатора</span>}
          </div>
        </div>
        <EventSchedule occurrences={event.occurrences ?? []} isFree={event.isFree} />
        <article className="description">
          <span className="eyebrow coral">О событии</span>
          <h2>Подробности</h2>
          <p>{event.description}</p>
        </article>
      </div>
    </main>
  );
}
