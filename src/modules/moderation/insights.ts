export type ModerationInput = {
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  venueId: string | null;
  address: string | null;
  priceMin: unknown;
  isFree: boolean;
  ageRestriction: string | null;
  ticketUrl: string | null;
  organizerId: string | null;
  endsAt: Date | null;
  confidence: unknown;
  publishConfidence: unknown;
};

export function moderationInsights(event: ModerationInput) {
  const missing: string[] = [];
  if (!event.description && !event.shortDescription) missing.push("описание");
  if (!event.imageUrl) missing.push("изображение");
  if (!event.venueId && !event.address) missing.push("место или адрес");
  if (!event.isFree && event.priceMin === null) missing.push("стоимость");
  if (!event.ageRestriction) missing.push("возрастное ограничение");
  if (!event.ticketUrl) missing.push("ссылка на билеты");
  if (!event.organizerId) missing.push("организатор");
  if (!event.endsAt) missing.push("дата окончания");

  const ai = Math.round(Number(event.confidence ?? 0) * 100);
  const publish = Math.round(Number(event.publishConfidence ?? 0) * 100);
  const reasons: string[] = [];
  if (publish < 90) reasons.push("publish confidence ниже 90%");
  if (ai < 80) reasons.push("AI confidence ниже 80%");
  if (missing.length) reasons.push("карточка заполнена не полностью");
  return { missing, reasons, ai, publish };
}

