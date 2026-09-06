import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Event } from "@/modules/events/types";
import { formatEventDate, formatEventTime, formatPrice } from "@/lib/format";

export function EventCard({ event, priority = false }: { event: Event; priority?: boolean }) {
  const occurrenceCount = event.occurrences?.length ?? 0;
  return (
    <article className="event-card">
      <Link href={`/${event.city.slug}/events/${event.slug}`} className="event-image">
        <Image src={event.imageUrl} alt="" fill sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 31vw" priority={priority} />
        <span className={`price ${event.isFree ? "free" : ""}`}>{formatPrice(event.isFree, event.priceMin, event.priceMax)}</span>
        {event.ageRestriction !== "Возраст уточняется" && <span className="age">{event.ageRestriction}</span>}
      </Link>
      <div className="event-body">
        <div className="event-meta">
          <strong>{formatEventDate(event.startsAt, event.city.timezone)}</strong>
          <span>{event.timeTbd ? "По согласованию" : formatEventTime(event.startsAt, event.city.timezone)}</span>
          <span className="category-dot">{event.category.name}</span>
        </div>
        <Link href={`/${event.city.slug}/events/${event.slug}`}><h3>{event.title}</h3></Link>
        <p>{event.shortDescription}</p>
        {occurrenceCount > 1 && <div className="showtime-summary">{occurrenceCount} сеансов в расписании</div>}
        <div className="venue"><MapPin size={15} />{event.venue}</div>
      </div>
    </article>
  );
}
