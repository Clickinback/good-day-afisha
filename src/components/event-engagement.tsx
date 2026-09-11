"use client";

import type { ComponentProps, ReactNode } from "react";
import { useEffect } from "react";
import type { EngagementActionInput } from "@/lib/event-engagement";

const viewedEvents = new Set<string>();

function trackEngagement(eventSlug: string, action: EngagementActionInput) {
  void fetch(`/api/v1/events/${encodeURIComponent(eventSlug)}/engagement`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => undefined);
}

export function EventViewTracker({ eventSlug }: { eventSlug: string }) {
  useEffect(() => {
    if (viewedEvents.has(eventSlug)) return;
    viewedEvents.add(eventSlug);
    trackEngagement(eventSlug, "view");
  }, [eventSlug]);
  return null;
}

type TrackedTicketLinkProps = Omit<ComponentProps<"a">, "href" | "onClick"> & {
  children: ReactNode;
  eventSlug: string;
  href: string;
};

export function TrackedTicketLink({ eventSlug, href, children, ...props }: TrackedTicketLinkProps) {
  return <a href={href} onClick={() => trackEngagement(eventSlug, "ticket")} {...props}>{children}</a>;
}
