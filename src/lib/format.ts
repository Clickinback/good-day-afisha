const defaultTimeZone = "Europe/Minsk";
const posterMonths = ["ЯНВ", "ФЕВ", "МАР", "АПР", "МАЙ", "ИЮН", "ИЮЛ", "АВГ", "СЕН", "ОКТ", "НОЯ", "ДЕК"] as const;

export const formatPosterDate = (value = new Date(), timeZone = defaultTimeZone) => {
  const parts = new Intl.DateTimeFormat("en", { day: "numeric", month: "numeric", timeZone }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return { month: posterMonths[Number(part("month")) - 1], day: String(Number(part("day"))) };
};

export const formatEventDate = (value: string, timeZone = defaultTimeZone) => new Intl.DateTimeFormat("ru-BY", { weekday:"short", day:"numeric", month:"long", timeZone }).format(new Date(value)).replace(/^./, (c) => c.toUpperCase());
export const formatEventTime = (value: string, timeZone = defaultTimeZone) => new Intl.DateTimeFormat("ru-BY", { hour:"2-digit", minute:"2-digit", timeZone }).format(new Date(value));
export const formatEventDayKey = (value: string, timeZone = defaultTimeZone) => {
  const parts = new Intl.DateTimeFormat("en", { year:"numeric", month:"2-digit", day:"2-digit", timeZone }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};
export const formatPrice = (isFree: boolean, min: number | null, max?: number | null) => isFree ? "Бесплатно" : min===null ? "Цена уточняется" : max!==null&&max!==undefined&&max!==min ? `${min}–${max} BYN` : `от ${min} BYN`;
