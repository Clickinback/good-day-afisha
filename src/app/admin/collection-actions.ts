"use server";
import { revalidatePath } from "next/cache";import { requireAdmin } from "@/lib/admin-auth";import { prisma } from "@/lib/prisma";import { generateCollections } from "@/modules/collections/service";
export async function generateCollectionsNow(){await requireAdmin();await generateCollections();revalidatePath("/admin/collections");revalidatePath("/","layout")}
export async function setCollectionOverride(formData:FormData){
  await requireAdmin();
  const collectionId=String(formData.get("collectionId"));
  const eventId=String(formData.get("eventId"));
  const mode=String(formData.get("mode"));
  if(mode==="pin")await prisma.$transaction([
    prisma.collectionExclusion.deleteMany({where:{collectionId,eventId}}),
    prisma.collectionEvent.upsert({where:{collectionId_eventId:{collectionId,eventId}},create:{collectionId,eventId,position:0,pinned:true},update:{pinned:true,position:0}}),
  ]);
  else if(mode==="exclude")await prisma.$transaction([
    prisma.collectionEvent.deleteMany({where:{collectionId,eventId}}),
    prisma.collectionExclusion.upsert({where:{collectionId_eventId:{collectionId,eventId}},create:{collectionId,eventId},update:{}}),
  ]);
  else await prisma.$transaction([
    prisma.collectionEvent.deleteMany({where:{collectionId,eventId,pinned:true}}),
    prisma.collectionExclusion.deleteMany({where:{collectionId,eventId}}),
  ]);
  revalidatePath(`/admin/collections/${collectionId}`);
}
