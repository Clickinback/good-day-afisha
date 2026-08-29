import { Prisma } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { parsedEventSchema,type ParsedEvent } from "@/modules/ai-parser/schema";
import { recordSystemError } from "@/modules/collectors/errors";
import { deduplicationConfig } from "./config";
import { normalize,scoreEvents } from "./similarity";

export type DeduplicationResult={rawEventId:string;decision:"MATCHED"|"MODERATION"|"CREATED"|"SKIPPED";eventId?:string;score?:number;reason?:string};
const localDate=(date:string,time:string|null,timezone:string)=>fromZonedTime(`${date}T${time??"00:00"}:00`,timezone);

async function findCity(parsed:ParsedEvent,sourceCityId:string|null){
  if(sourceCityId)return prisma.city.findUnique({where:{id:sourceCityId}});
  if(!parsed.city)return null;
  const cities=await prisma.city.findMany({where:{active:true}});
  const target=normalize(parsed.city);
  return cities.find(city=>normalize(city.name)===target)??cities.find(city=>target.includes(normalize(city.name)))??null;
}

async function uniqueSlug(title:string){
  const base=normalize(title).replace(/\s+/g,"-").replace(/[^a-zа-я0-9-]/g,"").slice(0,70)||"event";
  let slug=base,index=2;
  while(await prisma.event.findUnique({where:{slug},select:{id:true}}))slug=`${base}-${index++}`;
  return slug;
}

async function createEventFromRaw(rawId:string){
  const raw=await prisma.rawEvent.findUniqueOrThrow({where:{id:rawId},include:{source:true}});
  const parsed=parsedEventSchema.parse(raw.parsedData);
  if(!parsed.isEvent||!parsed.title||!parsed.startDate)return null;
  const title=parsed.title,startDate=parsed.startDate;
  const city=await findCity(parsed,raw.source.cityId);
  if(!city)return null;
  const category=await prisma.category.findUnique({where:{slug:parsed.category??"other"}})??await prisma.category.findUnique({where:{slug:"other"}});
  if(!category)return null;
  const startsAt=localDate(startDate,parsed.startTime,city.timezone);
  const endsAt=parsed.endDate?localDate(parsed.endDate,parsed.endTime,city.timezone):null;
  const slug=await uniqueSlug(title);
  return prisma.$transaction(async tx=>{
    const event=await tx.event.create({data:{slug,title,shortDescription:parsed.description?.slice(0,280),description:parsed.description,imageUrl:raw.imageUrl,cityId:city.id,address:parsed.address,startsAt,timeTbd:parsed.timeTbd,endsAt,categoryId:category.id,priceMin:parsed.priceMin,priceMax:parsed.priceMax,isFree:parsed.isFree??false,ageRestriction:parsed.ageRestriction,ticketUrl:parsed.ticketUrl,canonicalSourceUrl:raw.url,status:"PENDING",confidence:parsed.confidence,additionMethod:"AUTOMATIC",moderationStatus:"PENDING"}});
    await tx.eventSource.create({data:{eventId:event.id,sourceId:raw.sourceId,rawEventId:raw.id,sourceUrl:raw.url,isPrimary:true}});
    await tx.moderationLog.create({data:{eventId:event.id,rawEventId:raw.id,actorId:"deduplication-engine",action:"CREATED",after:{decision:"new_event",confidence:parsed.confidence}}});
    return event;
  });
}

export async function deduplicateRawEvent(rawEventId:string):Promise<DeduplicationResult>{
  const raw=await prisma.rawEvent.findUniqueOrThrow({where:{id:rawEventId},include:{source:{include:{city:true}},eventSources:true,duplicateCandidates:true}});
  if(raw.processingStatus!=="PROCESSED")return {rawEventId,decision:"SKIPPED",reason:"RawEvent не обработан AI"};
  if(raw.eventSources.length||raw.duplicateCandidates.length)return {rawEventId,decision:"SKIPPED",reason:"Deduplication уже выполнен"};
  let parsed:ParsedEvent;
  try{parsed=parsedEventSchema.parse(raw.parsedData)}catch(error){await recordSystemError("deduplication","validateParsedData",error,{rawEventId});return {rawEventId,decision:"SKIPPED",reason:"Некорректный parsedData"}}
  if(!parsed.isEvent||!parsed.title||!parsed.startDate)return {rawEventId,decision:"SKIPPED",reason:"Недостаточно данных"};
  const title=parsed.title;
  const city=await findCity(parsed,raw.source.cityId);
  if(!city)return {rawEventId,decision:"SKIPPED",reason:"Город не определён"};
  const startsAt=localDate(parsed.startDate,parsed.startTime,city.timezone);
  const window=deduplicationConfig.candidateWindowHours*3600_000;
  const candidates=await prisma.event.findMany({where:{cityId:city.id,startsAt:{gte:new Date(+startsAt-window),lte:new Date(+startsAt+window)},status:{notIn:["REJECTED","CANCELLED"]}},include:{city:true,venue:true,organizer:true},take:deduplicationConfig.maxCandidates});
  const scored=candidates.map(event=>({event,breakdown:scoreEvents({title,startsAt,city:city.name,venue:parsed.venue,organizer:parsed.organizer},{title:event.title,startsAt:event.startsAt,city:event.city.name,venue:event.venue?.name,organizer:event.organizer?.name})})).sort((a,b)=>b.breakdown.total-a.breakdown.total);
  const best=scored[0],gap=best?best.breakdown.total-(scored[1]?.breakdown.total??0):0;
  if(best&&best.breakdown.total>=deduplicationConfig.autoMatchThreshold&&gap>=deduplicationConfig.minAutoMatchGap){
    await prisma.$transaction(async tx=>{
      await tx.duplicateCandidate.create({data:{rawEventId,eventId:best.event.id,score:best.breakdown.total,breakdown:best.breakdown as unknown as Prisma.InputJsonValue,status:"AUTO_MATCHED",decidedBy:"deduplication-engine",decidedAt:new Date()}});
      await tx.eventSource.upsert({where:{eventId_sourceId_sourceUrl:{eventId:best.event.id,sourceId:raw.sourceId,sourceUrl:raw.url}},update:{rawEventId},create:{eventId:best.event.id,sourceId:raw.sourceId,rawEventId,sourceUrl:raw.url}});
      await tx.moderationLog.create({data:{eventId:best.event.id,rawEventId,actorId:"deduplication-engine",action:"MERGED",after:{score:best.breakdown.total,breakdown:best.breakdown} as Prisma.InputJsonObject}});
    });
    return {rawEventId,decision:"MATCHED",eventId:best.event.id,score:best.breakdown.total};
  }
  const ambiguous=scored.filter(item=>item.breakdown.total>=deduplicationConfig.moderationThreshold).slice(0,3);
  if(ambiguous.length){
    await prisma.duplicateCandidate.createMany({data:ambiguous.map(item=>({rawEventId,eventId:item.event.id,score:item.breakdown.total,breakdown:item.breakdown as unknown as Prisma.InputJsonValue,status:"PENDING"})),skipDuplicates:true});
    return {rawEventId,decision:"MODERATION",eventId:ambiguous[0].event.id,score:ambiguous[0].breakdown.total};
  }
  const event=await createEventFromRaw(rawEventId);
  return event?{rawEventId,decision:"CREATED",eventId:event.id}:{rawEventId,decision:"SKIPPED",reason:"Не удалось создать Event"};
}

export async function deduplicateBatch(limit=20){
  const rows=await prisma.rawEvent.findMany({where:{processingStatus:"PROCESSED",eventSources:{none:{}},duplicateCandidates:{none:{}}},select:{id:true},orderBy:{processedAt:"asc"},take:Math.min(Math.max(limit,1),100)});
  const results:DeduplicationResult[]=[];
  for(const row of rows)results.push(await deduplicateRawEvent(row.id));
  return results;
}

export async function resolveDuplicateCandidate(id:string,decision:"merge"|"dismiss",actor="environment-admin"){
  const candidate=await prisma.duplicateCandidate.findUniqueOrThrow({where:{id},include:{rawEvent:true}});
  if(candidate.status!=="PENDING")throw new Error("Решение уже принято");
  if(decision==="merge"){
    await prisma.$transaction(async tx=>{
      await tx.duplicateCandidate.update({where:{id},data:{status:"CONFIRMED",decidedBy:actor,decidedAt:new Date()}});
      await tx.duplicateCandidate.updateMany({where:{rawEventId:candidate.rawEventId,id:{not:id},status:"PENDING"},data:{status:"DISMISSED",decidedBy:actor,decidedAt:new Date()}});
      await tx.eventSource.upsert({where:{eventId_sourceId_sourceUrl:{eventId:candidate.eventId,sourceId:candidate.rawEvent.sourceId,sourceUrl:candidate.rawEvent.url}},update:{rawEventId:candidate.rawEventId},create:{eventId:candidate.eventId,sourceId:candidate.rawEvent.sourceId,rawEventId:candidate.rawEventId,sourceUrl:candidate.rawEvent.url}});
      await tx.moderationLog.create({data:{eventId:candidate.eventId,rawEventId:candidate.rawEventId,actorId:actor,action:"MERGED",after:{candidateId:id,score:Number(candidate.score)}}});
    });
    return candidate.eventId;
  }
  await prisma.duplicateCandidate.updateMany({where:{rawEventId:candidate.rawEventId,status:"PENDING"},data:{status:"DISMISSED",decidedBy:actor,decidedAt:new Date()}});
  const event=await createEventFromRaw(candidate.rawEventId);
  return event?.id??null;
}
