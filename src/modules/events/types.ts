export type City = { slug: string; name: string; preposition: string };
export type Category = { slug: string; name: string; icon: string };
export type EventOccurrence = { startsAt:string; endsAt?:string; price:number|null; ticketUrl?:string };
export type Event = {
  id: string; slug: string; title: string; shortDescription: string; description: string;
  imageUrl: string; city: City; venue: string; address: string; startsAt: string; timeTbd?: boolean;
  endsAt?: string; category: Category; priceMin: number | null; priceMax?: number | null;
  isFree: boolean; ageRestriction: string; ticketUrl?: string; featured?: boolean;
  currency?: string; organizer?: { name: string; websiteUrl?: string }; canonicalSourceUrl?: string;
  occurrences?: EventOccurrence[];
  status?: "DRAFT"|"PENDING"|"PUBLISHED"|"REJECTED"|"FINISHED"|"CANCELLED";
};

export type EventFilters = {
  city?: string; period?: string; category?: string; free?: boolean; kids?: boolean; q?: string;
};
