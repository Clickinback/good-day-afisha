import type { ParsedEvent } from "./schema";

function hasExplicitYear(text:string,year:number){return new RegExp(`(^|\\D)${year}(?!\\d)`).test(text)}
function inferredYear(month:number,day:number,publishedAt:Date){
  const publishedYear=publishedAt.getUTCFullYear();
  const candidate=Date.UTC(publishedYear,month-1,day);
  const publishedDay=Date.UTC(publishedYear,publishedAt.getUTCMonth(),publishedAt.getUTCDate());
  return candidate>=publishedDay?publishedYear:publishedYear+1;
}
function normalizeDate(value:string|null,rawText:string,publishedAt:Date){
  if(!value)return value;
  const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if(!match)return value;
  const [,yearText,monthText,dayText]=match,year=Number(yearText);
  if(hasExplicitYear(rawText,year))return value;
  return `${inferredYear(Number(monthText),Number(dayText),publishedAt)}-${monthText}-${dayText}`;
}
export function resolveDateAnchor(publishedAt?:Date|null,collectedAt?:Date|null):Date|null{
  for(const date of [publishedAt,collectedAt])if(date&&Number.isFinite(+date))return date;
  return null;
}
export function normalizeImplicitEventYear(event:ParsedEvent,rawText:string,publishedAt:Date|null|undefined,collectedAt?:Date|null):ParsedEvent{
  const anchor=resolveDateAnchor(publishedAt,collectedAt);
  if(!anchor)return event;
  return {...event,startDate:normalizeDate(event.startDate,rawText,anchor),endDate:normalizeDate(event.endDate,rawText,anchor)};
}
