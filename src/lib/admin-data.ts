import "server-only";
import { prisma } from "@/lib/prisma";

export async function getEventFormOptions(){const [cities,categories,venues,organizers]=await Promise.all([prisma.city.findMany({where:{active:true},orderBy:{name:"asc"},select:{id:true,name:true}}),prisma.category.findMany({where:{active:true},orderBy:{sortOrder:"asc"},select:{id:true,name:true}}),prisma.venue.findMany({orderBy:{name:"asc"},select:{id:true,name:true}}),prisma.organizer.findMany({orderBy:{name:"asc"},select:{id:true,name:true}})]);return {cities,categories,venues,organizers}}
export const dateTimeLocal=(date:Date|null)=>date?new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16):"";
