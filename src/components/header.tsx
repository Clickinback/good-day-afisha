"use client";
import Link from "next/link";
import { ChevronDown, MapPin, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";

const cityOptions = [{ slug: "polotsk", name: "Полоцк" }, { slug: "novopolotsk", name: "Новополоцк" }];

export function Header(){
  const pathname=usePathname();
  const routeCity=pathname.split("/")[1];
  const citySlug=cityOptions.some((item)=>item.slug===routeCity)?routeCity:"polotsk";
  const city=cityOptions.find((item)=>item.slug===routeCity)?.name??"Выбрать город";
  return <header className="header"><div className="shell header-inner"><Logo/><nav><Link href={`/${citySlug}/today`}>Сегодня</Link><Link href={`/${citySlug}/weekend`}>Выходные</Link><Link href={`/${citySlug}/free`}>Бесплатно</Link></nav><div className="header-actions"><details className="city-switcher"><summary><MapPin size={17}/><span>{city}</span><ChevronDown size={15}/></summary><div>{cityOptions.map((item)=><Link aria-current={item.slug===routeCity?"page":undefined} className={item.slug===routeCity?"active":""} href={`/${item.slug}`} key={item.slug} onClick={(event)=>event.currentTarget.closest("details")?.removeAttribute("open")}><span>{item.name}</span><small>{item.slug===routeCity?"Вы смотрите сейчас":"Открыть афишу"}</small></Link>)}</div></details><Link href={`/${citySlug}?q=`} className="icon-button" aria-label="Поиск"><Search size={20}/></Link></div></div></header>}
