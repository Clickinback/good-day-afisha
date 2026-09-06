import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventGrid } from "@/components/event-grid";
import { Filters } from "@/components/filters";
import { QuickLinks } from "@/components/quick-links";
import { RecommendedEvents } from "@/components/recommended-events";
import { getPublicCity,getPublicEvents } from "@/data/events";
import { splitRecommendedEvents } from "@/lib/recommendations";
type Props={params:Promise<{city:string}>;searchParams:Promise<{q?:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {city:slug}=await params;const city=await getPublicCity(slug);return city?{title:`Афиша ${city.name}`,description:`Куда сходить ${city.preposition} сегодня: актуальные концерты, выставки, кино и события для всей семьи.`,alternates:{canonical:`/${slug}`}}:{title:"Город не найден"}}
export default async function CityPage({params,searchParams}:Props){
  const [{city:slug},{q}]=await Promise.all([params,searchParams]);
  const [city,items]=await Promise.all([getPublicCity(slug),getPublicEvents({city:slug,q})]);
  if(!city)notFound();
  const split=q?{recommended:[],remaining:items}:splitRecommendedEvents(items);
  return <main><section className="city-hero"><div className="shell"><span className="eyebrow">Актуальная афиша</span><h1>Что происходит<br/><em>{city.preposition}</em></h1><p>{items.length} событий для хорошего дня</p></div></section><section className="shell section city-quick"><QuickLinks city={slug}/></section><RecommendedEvents events={split.recommended}/><section className="shell section events-list"><Filters city={slug} q={q}/>{q||split.remaining.length?<><div className="section-head compact"><h2>{q?`Результаты поиска «${q}»`:split.recommended.length?"Ещё события":"Ближайшие события"}</h2><span>{split.remaining.length} найдено</span></div><EventGrid events={split.remaining} empty="По вашему запросу ничего не найдено — попробуйте другое название."/></>:null}</section></main>
}
