import Link from "next/link";
import { categories } from "@/data/demo";
export function Filters({city, active, q}:{city:string;active?:string;q?:string}) { return <div className="filters"><form className="search-form"><input name="q" defaultValue={q} placeholder="Найти концерт, место, событие…"/><button>Найти</button></form><div className="chips"><Link className={!active?'active':''} href={`/${city}`}>Все</Link>{categories.map(c=><Link className={active===c.slug?'active':''} key={c.slug} href={`/${city}/${c.slug}`}><span>{c.icon}</span>{c.name}</Link>)}</div></div> }
