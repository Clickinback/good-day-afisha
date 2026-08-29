import { prisma } from "@/lib/prisma";
import { assertRobotsAllowed,safeFetchPage } from "./http";
import { collectorFor } from "./registry";
import { recordSystemError } from "./errors";
import { persistCollectedImage } from "./image-storage";
import { syncScreeningsForRaw } from "./screenings";
import type { WebsiteConfig } from "./types";

export type CollectionResult={runId:string;sourceId:string;status:"SUCCEEDED"|"PARTIAL"|"FAILED";foundCount:number;createdCount:number;skippedCount:number;errorCount:number};

async function existingRaw(sourceId:string,externalId:string|undefined,url:string){return prisma.rawEvent.findFirst({where:{sourceId,OR:[...(externalId?[{externalId}]:[]),{url}]},include:{eventSources:{select:{eventId:true}}}})}

export async function collectSource(sourceId:string):Promise<CollectionResult>{
  const source=await prisma.source.findUniqueOrThrow({where:{id:sourceId}});
  if(!source.active)throw new Error("Источник выключен");
  const run=await prisma.collectorRun.create({data:{sourceId}});
  let found=0,created=0,skipped=0,errors=0;
  try{
    const config=(source.config??{}) as WebsiteConfig;
    if(config.respectRobots!==false)await assertRobotsAllowed(source.url);
    const collector=collectorFor(source);
    const items=await collector.collect(source,{fetchPage:safeFetchPage,log:(message,details)=>console.info(`[collector:${source.id}] ${message}`,details??{})});
    found=items.length;
    for(const item of items){
      try{
        const existing=await existingRaw(source.id,item.externalId,item.url);
        if(existing&&config.syncScreenings)await syncScreeningsForRaw(existing.id,item.url,safeFetchPage);
        if(existing?.imageUrl?.startsWith("/media/events/")){skipped++;continue}
        let storedImage:string|null=null;
        if(item.imageUrl){try{storedImage=await persistCollectedImage(item.imageUrl)}catch(error){errors++;await recordSystemError("collector","persistImage",error,{sourceId:source.id,url:item.url,imageUrl:item.imageUrl})}}
        if(existing){
          if(storedImage)await prisma.$transaction([prisma.rawEvent.update({where:{id:existing.id},data:{imageUrl:storedImage}}),prisma.event.updateMany({where:{sources:{some:{rawEventId:existing.id}}},data:{imageUrl:storedImage}})]);
          skipped++;continue;
        }
        await prisma.rawEvent.create({data:{sourceId:source.id,externalId:item.externalId,url:item.url,rawText:item.rawText,rawHtml:item.rawHtml,imageUrl:storedImage,publishedAt:item.publishedAt&&Number.isFinite(+item.publishedAt)?item.publishedAt:null}});
        created++;
      }catch(error){errors++;await recordSystemError("collector","saveRawEvent",error,{sourceId:source.id,url:item.url})}
    }
    const status=errors?"PARTIAL":"SUCCEEDED";
    await prisma.$transaction([prisma.collectorRun.update({where:{id:run.id},data:{status,finishedAt:new Date(),foundCount:found,createdCount:created,skippedCount:skipped,errorCount:errors}}),prisma.source.update({where:{id:source.id},data:{lastCheckedAt:new Date()}})]);
    return {runId:run.id,sourceId,status,foundCount:found,createdCount:created,skippedCount:skipped,errorCount:errors};
  }catch(error){
    errors++;const message=error instanceof Error?error.message:String(error);
    await prisma.collectorRun.update({where:{id:run.id},data:{status:"FAILED",finishedAt:new Date(),foundCount:found,createdCount:created,skippedCount:skipped,errorCount:errors,errorMessage:message}});
    await recordSystemError("collector",collectorName(source.type),error,{sourceId:source.id,runId:run.id});
    return {runId:run.id,sourceId,status:"FAILED",foundCount:found,createdCount:created,skippedCount:skipped,errorCount:errors};
  }
}

function collectorName(type:string){return `collect${type[0]}${type.slice(1).toLowerCase()}`}
export async function collectActiveSources(){const sources=await prisma.source.findMany({where:{active:true},select:{id:true}});const results:CollectionResult[]=[];for(const source of sources)results.push(await collectSource(source.id));return results}
