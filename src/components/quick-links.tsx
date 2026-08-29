import Link from "next/link";
const links=[['today','Сегодня','События на этот вечер'],['tomorrow','Завтра','Планы без спешки'],['weekend','Выходные','Лучшее на уикенд'],['kids','С детьми','Для маленьких и больших'],['free','Бесплатно','Впечатления без билета']];
export function QuickLinks({city}:{city:string}) { return <div className="quick-links">{links.map(([path,title,sub],i)=><Link key={path} href={`/${city}/${path}`} className={`quick q${i}`}><b>{title}</b><span>{sub}</span><i>↗</i></Link>)}</div> }
