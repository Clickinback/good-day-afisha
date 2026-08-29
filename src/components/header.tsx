"use client";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
export function Header(){const pathname=usePathname();const citySlug=pathname.split("/")[1]==="novopolotsk"?"novopolotsk":"polotsk";const city=citySlug==="novopolotsk"?"Новополоцк":"Полоцк";return <header className="header"><div className="shell header-inner"><Logo/><nav><Link href={`/${citySlug}/today`}>Сегодня</Link><Link href={`/${citySlug}/weekend`}>Выходные</Link><Link href={`/${citySlug}/free`}>Бесплатно</Link></nav><div className="header-actions"><Link href={`/${citySlug}`} className="city-select"><MapPin size={17}/>{city}</Link><Link href={`/${citySlug}?q=`} className="icon-button" aria-label="Поиск"><Search size={20}/></Link></div></div></header>}
