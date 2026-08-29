import { prisma } from "@/lib/prisma";
import { extractJsonLdEvents } from "./website";
import type { FetchPageResult } from "./types";

type Screening={startsAt:Date;price:number|null;ticketUrl:string|null;externalId:string};

function parseScreenings(html:string,url:string):Screening[]{return extractJsonLdEvents(html,url).flatMap(item=>{try{const node=JSON.parse(item.rawHtml??"{}") as Record<string,unknown>;if(node["@type"]!=="ScreeningEvent"||typeof node.startDate!=="string")return [];const startsAt=new Date(node.startDate);if(!Number.isFinite(+startsAt))return [];const offer=node.offers&&typeof node.offers==="object"?node.offers as Record<string,unknown>:{};const price=typeof offer.price==="string"||typeof offer.price==="number"?Number(offer.price):null;return [{startsAt,price:Number.isFinite(price)?price:null,ticketUrl:typeof offer.url==="string"?offer.url:null,externalId:`${url}#${node.startDate}`}]}catch{return []}})}

export async function syncScreeningsForRaw(rawEventId:string,url:string,fetchPage:(url:string)=>Promise<FetchPageResult>){
  const link=await prisma.eventSource.findFirst({where:{rawEventId},select:{eventId:true}});
  if(!link)return 0;
  const page=await fetchPage(url);
  const screenings=parseScreenings(page.html,page.url).sort((a,b)=>+a.startsAt-+b.startsAt);
  if(!screenings.length)return 0;
  const externalIds=screenings.map(item=>item.externalId);
  await prisma.$transaction(async tx=>{
    for(const item of screenings)await tx.eventOccurrence.upsert({where:{eventId_startsAt:{eventId:link.eventId,startsAt:item.startsAt}},update:{price:item.price,ticketUrl:item.ticketUrl,externalId:item.externalId},create:{eventId:link.eventId,startsAt:item.startsAt,price:item.price,ticketUrl:item.ticketUrl,externalId:item.externalId}});
    await tx.eventOccurrence.deleteMany({where:{eventId:link.eventId,startsAt:{gte:new Date()},externalId:{notIn:externalIds}}});
    const future=screenings.filter(item=>item.startsAt>=new Date());
    const active=future.length?future:screenings;
    const prices=active.map(item=>item.price).filter((price):price is number=>price!==null);
    await tx.event.update({where:{id:link.eventId},data:{startsAt:active[0].startsAt,priceMin:prices.length?Math.min(...prices):null,priceMax:prices.length?Math.max(...prices):null,ticketUrl:active[0].ticketUrl}});
  });
  return screenings.length;
}

export { parseScreenings };
