import type { Event } from "@/modules/events/types";

const dateOnly=new Intl.DateTimeFormat("ru-BY",{day:"numeric",month:"long"});
const dateTime=new Intl.DateTimeFormat("ru-BY",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"});
const schedule=(event:Event)=>event.timeTbd?`${dateOnly.format(new Date(event.startsAt))} · время по согласованию`:dateTime.format(new Date(event.startsAt));

export function renderTelegramCollection(input:{title:string;description?:string;events:Event[];baseUrl:string}){const lines=[`☀️ ${input.title}`,input.description??"",...input.events.flatMap((event,index)=>[`${index+1}. ${event.title}`,`${schedule(event)} · ${event.venue}`,event.isFree?"Бесплатно":event.priceMin===null?"Цена уточняется":`от ${event.priceMin} BYN`,`${input.baseUrl}/${event.city.slug}/events/${event.slug}`,""])];return lines.join("\n").trim()}
