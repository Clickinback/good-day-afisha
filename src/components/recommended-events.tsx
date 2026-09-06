import { Sparkles } from "lucide-react";
import type { Event } from "@/modules/events/types";
import { EventGrid } from "./event-grid";

export function RecommendedEvents({ events }: { events: Event[] }) {
  if (!events.length) return null;
  return <section className="recommendations"><div className="shell"><div className="recommendation-head"><span><Sparkles size={18}/>Выбор Good Day</span><h2>С чего начать</h2><p>Подборка актуальных событий, которые стоит рассмотреть в первую очередь.</p></div><EventGrid events={events}/></div></section>;
}
