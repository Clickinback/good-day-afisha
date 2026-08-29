import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventGrid } from "@/components/event-grid";
import { Filters } from "@/components/filters";
import { QuickLinks } from "@/components/quick-links";
import { getPublicCity,getPublicEvents } from "@/data/events";
type Props={params:Promise<{city:string}>;searchParams:Promise<{q?:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {city:slug}=await params;const city=await getPublicCity(slug);return city?{title:`Афиша ${city.name}`,description:`Куда сходить ${city.preposition} сегодня: актуальные концерты, выставки, кино и события для всей семьи.`,alternates:{canonical:`/${slug}`}}:{title:"Город не найден"}}
export default async function CityPage({params,searchParams}:Props){const {city:slug}=await params;const {q}=await searchParams;const city=await getPublicCity(slug);if(!city)notFound();const items=await getPublicEvents({city:slug,q});return <main><section className="city-hero"><div className="shell"><span className="eyebrow">Актуальная афиша</span><h1>Что происходит<br/><em>{city.preposition}</em></h1><p>{items.length} событий для хорошего дня</p></div></section><section className="shell section city-quick"><QuickLinks city={slug}/></section><section className="shell section"><Filters city={slug} q={q}/><div className="section-head compact"><h2>{q?`Результаты поиска «${q}»`:"Ближайшие события"}</h2><span>{items.length} найдено</span></div><EventGrid events={items}/></section></main>}
