const date = new Intl.DateTimeFormat("ru-BY", { weekday:"short", day:"numeric", month:"long" });
const time = new Intl.DateTimeFormat("ru-BY", { hour:"2-digit", minute:"2-digit" });
export const formatEventDate = (value: string) => date.format(new Date(value)).replace(/^./, (c) => c.toUpperCase());
export const formatEventTime = (value: string) => time.format(new Date(value));
export const formatPrice = (isFree: boolean, min: number | null, max?: number | null) => isFree ? "Бесплатно" : min===null ? "Цена уточняется" : max!==null&&max!==undefined&&max!==min ? `${min}–${max} BYN` : `от ${min} BYN`;
