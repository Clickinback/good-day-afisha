import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractJsonLdEvents } from "./website";
import type { CollectedItem,FetchPageResult } from "./types";
import { extractCinemaDetails } from "./cinema-details";
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
  const link=await prisma.eventSource.findFirst({where:{rawEventId},select:{eventId:true,event:{select:{title:true,status:true,cityId:true,description:true,shortDescription:true,venueId:true,address:true,ageRestriction:true,imageUrl:true}}}});
  if(!link)return 0;
  const page=await fetchPage(url);
  const details=extractCinemaDetails(page.html,page.url);
  const eventData:Prisma.EventUncheckedUpdateInput={};
  if(!link.event.description&&details.description){eventData.description=details.description;if(!link.event.shortDescription)eventData.shortDescription=details.description.slice(0,280)}
  if(!link.event.ageRestriction&&details.ageRestriction)eventData.ageRestriction=details.ageRestriction;
  if(!link.event.address&&details.address)eventData.address=details.address;
  if(!link.event.venueId&&details.venueName&&details.address){
    const venue=await prisma.venue.findFirst({where:{cityId:link.event.cityId,OR:[{name:details.venueName},{slug:"kinoteatr-minsk"}]}})??await prisma.venue.upsert({where:{cityId_slug:{cityId:link.event.cityId,slug:"kinoteatr-minsk"}},update:{},create:{cityId:link.event.cityId,slug:"kinoteatr-minsk",name:details.venueName,address:details.address}});
    eventData.venueId=venue.id;
  }
  const missingStoredImage=Boolean(link.event.imageUrl?.startsWith("/media/events/")&&!await storedImageExists(link.event.imageUrl));
  let refreshedImage:string|null|undefined;
  if((!link.event.imageUrl||missingStoredImage)&&details.imageUrl){
    try{
      const imageUrl=await persistCollectedImage(details.imageUrl,"poster");
      if(imageUrl)refreshedImage=imageUrl;
    }catch(error){await recordSystemError("collector","persistPoster",error,{rawEventId,url:details.imageUrl})}
  }
  if(missingStoredImage&&refreshedImage===undefined)refreshedImage=null;
  if(refreshedImage!==undefined)eventData.imageUrl=refreshedImage;
  if(Object.keys(eventData).length){
    await prisma.$transaction(async tx=>{
      await tx.event.update({where:{id:link.eventId},data:eventData});
      if(refreshedImage!==undefined)await tx.rawEvent.update({where:{id:rawEventId},data:{imageUrl:refreshedImage}});
    });
    console.info("[collector:screenings] enriched",{rawEventId,title:link.event.title,fields:Object.keys(eventData)});
  }
  const detailScreenings=parseScreenings(page.html,page.url);
  const listingScreening=listingItem?screeningFromListing(listingItem):null;
  const screenings=(detailScreenings.length?detailScreenings:listingScreening?[listingScreening]:[]).sort((a,b)=>+a.startsAt-+b.startsAt);
  const strategy=detailScreenings.length?"detail-json-ld":listingScreening?"listing-json-ld":"none";
  console.info("[collector:screenings] parsed",{rawEventId,title:link.event.title,url,strategy,showtimes:screenings.length,futureShowtimes:screenings.filter(item=>item.startsAt>=new Date()).length});
  if(!screenings.length)return 0;
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
