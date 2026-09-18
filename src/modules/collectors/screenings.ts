import { prisma } from "@/lib/prisma";
import { extractJsonLdEvents } from "./website";
import type { CollectedItem,FetchPageResult } from "./types";
import { extractCinemaPoster } from "./cinema-poster";
import { persistCollectedImage,storedImageExists } from "./image-storage";
import { recordSystemError } from "./errors";

type Screening={startsAt:Date;price:number|null;ticketUrl:string|null;externalId:string};

export function shouldReactivateScreeningEvent(status:string,hasFutureScreenings:boolean){return status==="FINISHED"&&hasFutureScreenings}

function screeningFromNode(rawHtml:string|undefined,url:string,allowEvent=false):Screening|null{
  if(!rawHtml)return null;
  try{
    const node=JSON.parse(rawHtml) as Record<string,unknown>;
    const types=Array.isArray(node["@type"])?node["@type"]:[node["@type"]];
    if(!types.includes("ScreeningEvent")&&!(allowEvent&&types.includes("Event")))return null;
    if(typeof node.startDate!=="string"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(node.startDate))return null;
    const startsAt=new Date(node.startDate);
    if(!Number.isFinite(+startsAt))return null;
    const offer=Array.isArray(node.offers)?node.offers[0]:node.offers;
    const details=offer&&typeof offer==="object"?offer as Record<string,unknown>:{};
    const price=typeof details.price==="string"||typeof details.price==="number"?Number(details.price):null;
    return {startsAt,price:Number.isFinite(price)?price:null,ticketUrl:typeof details.url==="string"?details.url:null,externalId:`${url}#${node.startDate}`};
  }catch{return null}
}

function parseScreenings(html:string,url:string):Screening[]{
  return extractJsonLdEvents(html,url).flatMap(item=>{
    const screening=screeningFromNode(item.rawHtml,url);
    return screening?[screening]:[];
  });
}

export function screeningFromListing(item:CollectedItem):Screening|null{
  return screeningFromNode(item.rawHtml,item.url,true);
}

export async function syncScreeningsForRaw(rawEventId:string,url:string,fetchPage:(url:string)=>Promise<FetchPageResult>,listingItem?:CollectedItem){
  const link=await prisma.eventSource.findFirst({where:{rawEventId},select:{eventId:true,event:{select:{status:true,imageUrl:true}}}});
  if(!link)return 0;
  const page=await fetchPage(url);
  const hasPoster=Boolean(link.event.imageUrl?.startsWith("/media/events/poster-")&&await storedImageExists(link.event.imageUrl));
  const posterUrl=hasPoster?undefined:extractCinemaPoster(page.html,page.url);
  if(posterUrl){
    try{
      const imageUrl=await persistCollectedImage(posterUrl,"poster");
      if(imageUrl)await prisma.$transaction([
        prisma.rawEvent.update({where:{id:rawEventId},data:{imageUrl}}),
        prisma.event.update({where:{id:link.eventId},data:{imageUrl}}),
      ]);
    }catch(error){await recordSystemError("collector","persistPoster",error,{rawEventId,url:posterUrl})}
  }
  const detailScreenings=parseScreenings(page.html,page.url);
  const listingScreening=listingItem?screeningFromListing(listingItem):null;
  const screenings=(detailScreenings.length?detailScreenings:listingScreening?[listingScreening]:[]).sort((a,b)=>+a.startsAt-+b.startsAt);
  if(!screenings.length){console.warn("[collector:screenings] no showtimes extracted",{rawEventId,url});return 0}
  if(!detailScreenings.length)console.info("[collector:screenings] listing showtime used",{rawEventId,url});
  const externalIds=screenings.map(item=>item.externalId);
  await prisma.$transaction(async tx=>{
    for(const item of screenings)await tx.eventOccurrence.upsert({where:{eventId_startsAt:{eventId:link.eventId,startsAt:item.startsAt}},update:{price:item.price,ticketUrl:item.ticketUrl,externalId:item.externalId},create:{eventId:link.eventId,startsAt:item.startsAt,price:item.price,ticketUrl:item.ticketUrl,externalId:item.externalId}});
    if(detailScreenings.length)await tx.eventOccurrence.deleteMany({where:{eventId:link.eventId,startsAt:{gte:new Date()},externalId:{notIn:externalIds}}});
    const future=screenings.filter(item=>item.startsAt>=new Date());
    const active=future.length?future:screenings;
    const prices=active.map(item=>item.price).filter((price):price is number=>price!==null);
    await tx.event.update({where:{id:link.eventId},data:{startsAt:active[0].startsAt,priceMin:prices.length?Math.min(...prices):null,priceMax:prices.length?Math.max(...prices):null,ticketUrl:active[0].ticketUrl,...(shouldReactivateScreeningEvent(link.event.status,future.length>0)?{status:"PUBLISHED" as const}:{})}});
  });
  return screenings.length;
}

export { parseScreenings };
