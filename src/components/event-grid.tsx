import type { Event } from "@/modules/events/types";
import { EventCard } from "./event-card";
export function EventGrid({ events, empty="Ничего не найдено — попробуйте изменить фильтры." }: { events:Event[]; empty?:string }) { return events.length ? <div className="event-grid">{events.map((event,i)=><EventCard key={event.id} event={event} priority={i<2}/>)}</div> : <div className="empty"><span>◌</span><h2>{empty}</h2></div> }
