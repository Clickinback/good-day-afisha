import type { Event } from "@/modules/events/types";

const defaultSiteUrl = "http://localhost:3000";

function absoluteUrl(pathOrUrl: string, siteUrl: string) {
  return new URL(pathOrUrl, `${siteUrl.replace(/\/$/, "")}/`).toString();
}

export function buildEventStructuredData(event: Event, siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl) {
  const eventUrl = absoluteUrl(`/${event.city.slug}/events/${event.slug}`, siteUrl);
  const offerPrice = event.isFree ? 0 : event.priceMin;
  const offer = offerPrice !== null && offerPrice !== undefined ? {
    "@type": "Offer",
    price: offerPrice,
    priceCurrency: event.currency ?? "BYN",
    url: event.ticketUrl ? absoluteUrl(event.ticketUrl, siteUrl) : eventUrl,
    availability: event.status === "CANCELLED" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
  } : undefined;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        "@id": `${eventUrl}#event`,
        name: event.title,
        description: event.shortDescription,
        image: [absoluteUrl(event.imageUrl, siteUrl)],
        url: eventUrl,
        startDate: event.startsAt,
        ...(event.endsAt ? { endDate: event.endsAt } : {}),
        eventStatus: event.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        location: {
          "@type": "Place",
          name: event.venue,
          address: {
            "@type": "PostalAddress",
            streetAddress: event.address,
            addressLocality: event.city.name,
            addressCountry: "BY",
          },
        },
        ...(event.organizer ? { organizer: {
          "@type": "Organization",
          name: event.organizer.name,
          ...(event.organizer.websiteUrl ? { url: absoluteUrl(event.organizer.websiteUrl, siteUrl) } : {}),
        } } : {}),
        ...(offer ? { offers: offer } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Афиша", item: absoluteUrl("/", siteUrl) },
          { "@type": "ListItem", position: 2, name: event.city.name, item: absoluteUrl(`/${event.city.slug}`, siteUrl) },
          { "@type": "ListItem", position: 3, name: event.title, item: eventUrl },
        ],
      },
    ],
  };
}
