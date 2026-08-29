import { getPublicEvent } from "@/data/events";
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){const {slug}=await params;const event=await getPublicEvent(decodeURIComponent(slug));return event?Response.json({data:event}):Response.json({error:{code:"NOT_FOUND",message:"Событие не найдено"}},{status:404})}
