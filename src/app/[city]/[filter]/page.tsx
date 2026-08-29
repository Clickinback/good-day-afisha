import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventGrid } from "@/components/event-grid";
import { Filters } from "@/components/filters";
import { categories } from "@/data/demo";
import { getPublicCity,getPublicEvents } from "@/data/events";
const special:Record<string,string>={today:"Сегодня",tomorrow:"Завтра",weekend:"На выходных",free:"Бесплатные события",kids:"События для детей"};
type Props={params:Promise<{city:string;filter:string}>;searchParams:Promise<{q?:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {city:slug,filter}=await params;const city=await getPublicCity(slug);const label=special[filter]??categories.find(c=>c.slug===filter)?.name;return city&&label?{title:`${label} ${city.preposition}`,description:`${label} ${city.preposition}: даты, места, цены и подробности.`,alternates:{canonical:`/${slug}/${filter}`}}:{title:"Страница не найдена"}}
export default async function FilterPage({params,searchParams}:Props){const {city:slug,filter}=await params;const {q}=await searchParams;const city=await getPublicCity(slug);const category=categories.find(c=>c.slug===filter);const label=special[filter]??category?.name;if(!city||!label)notFound();const items=await getPublicEvents({city:slug,period:["today","tomorrow","weekend"].includes(filter)?filter:undefined,category:category?.slug,free:filter==="free",kids:filter==="kids",q});return <main><section className="listing-hero"><div className="shell"><span className="eyebrow">{city.name} · афиша</span><h1>{label}</h1><p>Выбирайте настроение — детали мы уже собрали.</p></div></section><section className="shell section"><Filters city={slug} active={category?.slug} q={q}/><div className="section-head compact"><h2>Подходящие события</h2><span>{items.length} найдено</span></div><EventGrid events={items}/></section></main>}
