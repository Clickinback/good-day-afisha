import { fromZonedTime } from "date-fns-tz";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parsedEventSchema } from "@/modules/ai-parser/schema";
import { canApplyLifecycleUpdate,hasSuspiciousPastYear,isExpired,LIFECYCLE_POLICY_VERSION } from "./policy";
export async function finishExpiredEvents(now=new Date()){
  const events=await prisma.event.findMany({
    where:{status:{in:["PUBLISHED","PENDING"]}},
    include:{city:{select:{timezone:true}},occurrences:{where:{startsAt:{gte:now}},select:{id:true},take:1}},
  });
  let publishedFinished=0,pendingFinished=0,dateAnomalies=0;
  for(const event of events){
    if(event.occurrences.length||!isExpired({...event,timezone:event.city.timezone},now))continue;
    if(event.status==="PENDING"&&hasSuspiciousPastYear({startsAt:event.startsAt,timezone:event.city.timezone},now)){dateAnomalies++;continue}
    const pending=event.status==="PENDING";
    await prisma.$transaction([
      prisma.event.update({where:{id:event.id},data:{status:"FINISHED",...(pending?{moderationStatus:"NOT_REQUIRED" as const}:{})}}),
      prisma.moderationLog.create({data:{eventId:event.id,actorId:"lifecycle-policy",action:"EDITED",reason:`Истёк срок события; policy=${LIFECYCLE_POLICY_VERSION}`,before:{status:event.status,moderationStatus:event.moderationStatus},after:{status:"FINISHED",moderationStatus:pending?"NOT_REQUIRED":event.moderationStatus}}}),
    ]);
    if(pending)pendingFinished++;else publishedFinished++;
  }
  return {expirationChecked:events.length,finished:publishedFinished+pendingFinished,publishedFinished,pendingFinished,dateAnomalies};
}
const parsedDate=(date:string,time:string|null,timezone:string)=>fromZonedTime(`${date}T${time??"00:00"}:00`,timezone);
export async function applySourceLifecycleUpdates(limit=100){const raws=await prisma.rawEvent.findMany({where:{processingStatus:"PROCESSED",lifecycleProcessedAt:null,parsedData:{not:Prisma.JsonNull},eventSources:{some:{}}},include:{source:true,eventSources:{include:{event:{include:{city:true,sources:{select:{sourceId:true}}}}}}},orderBy:{processedAt:"asc"},take:limit});let applied=0,review=0,skipped=0;for(const raw of raws){const parsed=parsedEventSchema.safeParse(raw.parsedData);if(!parsed.success||!parsed.data.announcementStatus||parsed.data.announcementStatus==="scheduled"){await prisma.rawEvent.update({where:{id:raw.id},data:{lifecycleProcessedAt:new Date()}});skipped++;continue}for(const link of raw.eventSources){const event=link.event;const trusted=canApplyLifecycleUpdate(Number(raw.source.trustScore),new Set(event.sources.map(item=>item.sourceId)).size);const before={status:event.status,startsAt:event.startsAt,endsAt:event.endsAt};if(!trusted){await prisma.event.update({where:{id:event.id},data:{moderationStatus:"PENDING"}});review++}else if(parsed.data.announcementStatus==="cancelled"){await prisma.event.update({where:{id:event.id},data:{status:"CANCELLED",moderationStatus:"APPROVED"}});applied++}else if(parsed.data.announcementStatus==="postponed"){await prisma.event.update({where:{id:event.id},data:{status:"PENDING",moderationStatus:"PENDING"}});applied++}else if(parsed.data.startDate){const startsAt=parsedDate(parsed.data.startDate,parsed.data.startTime,event.city.timezone);const endsAt=parsed.data.endDate?parsedDate(parsed.data.endDate,parsed.data.endTime,event.city.timezone):null;await prisma.event.update({where:{id:event.id},data:{startsAt,timeTbd:parsed.data.timeTbd,endsAt,status:event.status==="CANCELLED"?"PUBLISHED":event.status,moderationStatus:"APPROVED"}});applied++}await prisma.moderationLog.create({data:{eventId:event.id,rawEventId:raw.id,action:parsed.data.announcementStatus==="cancelled"?"CANCELLED":"EDITED",reason:`Источник: ${raw.source.name}; policy=${LIFECYCLE_POLICY_VERSION}; trusted=${trusted}`,before,after:{announcementStatus:parsed.data.announcementStatus,startDate:parsed.data.startDate,startTime:parsed.data.startTime}}})}await prisma.rawEvent.update({where:{id:raw.id},data:{lifecycleProcessedAt:new Date()}})}return {checked:raws.length,applied,review,skipped}}
export async function runLifecycle(){const updates=await applySourceLifecycleUpdates();const expiration=await finishExpiredEvents();return {...expiration,sourceUpdatesChecked:updates.checked,applied:updates.applied,review:updates.review,skipped:updates.skipped}}
