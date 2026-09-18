import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePublicationConfidence } from "./confidence";
import { PUBLICATION_POLICY_VERSION,publicationConfig } from "./config";
import { isTrustedStructuredCinema } from "./structured-cinema";

export type PublicationResult={eventId:string;score:number;decision:"AUTO_PUBLISH"|"MODERATION"|"HOLD";status:"PUBLISHED"|"PENDING"|"DRAFT"};

export async function evaluateEventForPublication(eventId:string):Promise<PublicationResult>{
  const now=new Date();
  const event=await prisma.event.findUniqueOrThrow({where:{id:eventId},include:{sources:{include:{source:true}},organizer:true,category:true,occurrences:{where:{startsAt:{gte:now}},select:{startsAt:true},take:1}}});
  if(event.additionMethod!=="AUTOMATIC")throw new Error("Автопубликация разрешена только для AUTOMATIC событий");
  if(event.status==="PUBLISHED")return {eventId,score:Number(event.publishConfidence??0),decision:"AUTO_PUBLISH",status:"PUBLISHED"};
  const sourceScores=[...new Map(event.sources.map(link=>[link.sourceId,Number(link.source.trustScore)])).values()];
  const trustedCinema=isTrustedStructuredCinema(event.sources);
  const cinemaCategory=trustedCinema&&event.category.slug!=="cinema"?await prisma.category.findUnique({where:{slug:"cinema"},select:{id:true}}):null;
  const structuredCinema=trustedCinema&&(event.category.slug==="cinema"||Boolean(cinemaCategory))&&event.occurrences.length>0;
  const threshold=structuredCinema?publicationConfig.thresholds.structuredCinema:publicationConfig.thresholds.autoPublish;
  const breakdown=calculatePublicationConfidence({
    aiConfidence:Number(event.confidence??0),sourceTrustScores:sourceScores,autoPublishThreshold:threshold,
    quality:{hasTitle:Boolean(event.title),hasDescription:Boolean(event.description),hasImage:Boolean(event.imageUrl),hasLocation:Boolean(event.venueId||event.address),hasDateTime:Boolean(event.startsAt),hasPrice:event.isFree||event.priceMin!==null,hasAge:Boolean(event.ageRestriction),hasTicket:Boolean(event.ticketUrl),hasOrganizer:Boolean(event.organizerId),hasEnd:Boolean(event.endsAt)},
  });
  if(event.sources.some(link=>link.sourceId==="src_cinemaminsk_np"))console.info("[publication:structured-cinema] evaluated",{eventId,title:event.title,trustedSource:trustedCinema,futureScreening:event.occurrences.length>0,category:event.category.slug,hasImage:Boolean(event.imageUrl),hasLocation:Boolean(event.venueId||event.address),structuredCinema,threshold,score:breakdown.total,decision:breakdown.decision});
  const next=breakdown.decision==="AUTO_PUBLISH"?{status:"PUBLISHED" as const,moderationStatus:"APPROVED" as const,publishedAt:event.publishedAt??now}:breakdown.decision==="MODERATION"?{status:"PENDING" as const,moderationStatus:"PENDING" as const,publishedAt:event.publishedAt}:{status:"DRAFT" as const,moderationStatus:"PENDING" as const,publishedAt:event.publishedAt};
  await prisma.$transaction([
    prisma.event.update({where:{id:eventId},data:{...next,...(structuredCinema&&cinemaCategory?{categoryId:cinemaCategory.id}:{}),publishConfidence:breakdown.total,publicationEvaluatedAt:now,publicationPolicyVersion:PUBLICATION_POLICY_VERSION}}),
    prisma.moderationLog.create({data:{eventId,actorId:"publication-policy",action:breakdown.decision==="AUTO_PUBLISH"?"PUBLISHED":"EDITED",before:{status:event.status,categoryId:event.categoryId,publishConfidence:Number(event.publishConfidence??0)},after:{policyVersion:PUBLICATION_POLICY_VERSION,structuredCinema,threshold,categoryId:structuredCinema&&cinemaCategory?cinemaCategory.id:event.categoryId,...breakdown} as Prisma.InputJsonObject}}),
  ]);
  return {eventId,score:breakdown.total,decision:breakdown.decision,status:next.status};
}

export async function evaluatePublicationBatch(limit=50){
  const rows=await prisma.event.findMany({where:{additionMethod:"AUTOMATIC",status:{in:["DRAFT","PENDING"]}},select:{id:true},orderBy:{createdAt:"asc"},take:Math.min(Math.max(limit,1),200)});
  const results:PublicationResult[]=[];
  for(const row of rows)results.push(await evaluateEventForPublication(row.id));
  return results;
}
