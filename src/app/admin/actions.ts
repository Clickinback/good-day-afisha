"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminSession,destroyAdminSession,isValidAdminPassword,requireAdmin } from "@/lib/admin-auth";
import { clearAdminLoginFailures,getAdminLoginLockSeconds,recordAdminLoginFailure } from "@/lib/admin-login-throttle";
import { prisma } from "@/lib/prisma";
import { eventFormSchema,type EventFormState } from "@/modules/admin/schemas";
import { sourceFormSchema,type AdminFormState } from "@/modules/admin/schemas";

export async function login(_: {error?:string},formData:FormData):Promise<{error?:string}>{
  const lockSeconds=await getAdminLoginLockSeconds();
  if(lockSeconds>0)return {error:`Слишком много попыток. Повторите через ${Math.ceil(lockSeconds/60)} мин.`};
  const submitted=String(formData.get("password")??"");
  if(!isValidAdminPassword(submitted)){await recordAdminLoginFailure();return {error:"Неверный пароль"};}
  await clearAdminLoginFailures();
  await createAdminSession(); redirect("/admin");
}
export async function logout(){await destroyAdminSession();redirect("/admin/login")}

function values(formData:FormData){return Object.fromEntries(formData.entries())}
export async function createEvent(_:EventFormState,formData:FormData):Promise<EventFormState>{
  await requireAdmin();const parsed=eventFormSchema.safeParse(values(formData));
  if(!parsed.success)return {ok:false,message:"Проверьте заполненные поля",errors:parsed.error.flatten().fieldErrors};
  const d=parsed.data;
  try{await prisma.$transaction(async tx=>{const event=await tx.event.create({data:{title:d.title,slug:d.slug,shortDescription:d.shortDescription||null,description:d.description||null,imageUrl:d.imageUrl||null,cityId:d.cityId,categoryId:d.categoryId,venueId:d.venueId||null,organizerId:d.organizerId||null,address:d.address||null,startsAt:d.startsAt,timeTbd:d.timeTbd,endsAt:d.endsAt||null,priceMin:d.priceMin===""?null:d.priceMin,priceMax:d.priceMax===""?null:d.priceMax,isFree:d.isFree,ageRestriction:d.ageRestriction||null,ticketUrl:d.ticketUrl||null,status:d.status,additionMethod:"MANUAL",moderationStatus:d.status==="PUBLISHED"?"APPROVED":"NOT_REQUIRED",publishedAt:d.status==="PUBLISHED"?new Date():null}});await tx.moderationLog.create({data:{eventId:event.id,action:d.status==="PUBLISHED"?"PUBLISHED":"CREATED",actorId:"environment-admin",after:{title:event.title,status:event.status}}})});}
  catch(error){return {ok:false,message:error instanceof Error?`Не удалось сохранить: ${error.message}`:"Не удалось сохранить событие"}}
  revalidatePath("/admin/events");redirect("/admin/events");
}

export async function updateEvent(id:string,_:EventFormState,formData:FormData):Promise<EventFormState>{
  await requireAdmin();const parsed=eventFormSchema.safeParse(values(formData));
  if(!parsed.success)return {ok:false,message:"Проверьте заполненные поля",errors:parsed.error.flatten().fieldErrors};
  const d=parsed.data;
  try{await prisma.$transaction(async tx=>{const before=await tx.event.findUniqueOrThrow({where:{id}});const event=await tx.event.update({where:{id},data:{title:d.title,slug:d.slug,shortDescription:d.shortDescription||null,description:d.description||null,imageUrl:d.imageUrl||null,cityId:d.cityId,categoryId:d.categoryId,venueId:d.venueId||null,organizerId:d.organizerId||null,address:d.address||null,startsAt:d.startsAt,timeTbd:d.timeTbd,endsAt:d.endsAt||null,priceMin:d.priceMin===""?null:d.priceMin,priceMax:d.priceMax===""?null:d.priceMax,isFree:d.isFree,ageRestriction:d.ageRestriction||null,ticketUrl:d.ticketUrl||null,status:d.status,publishedAt:d.status==="PUBLISHED"?(before.publishedAt??new Date()):before.publishedAt}});await tx.moderationLog.create({data:{eventId:id,action:"EDITED",actorId:"environment-admin",before:{title:before.title,status:before.status},after:{title:event.title,status:event.status}}})});}
  catch(error){return {ok:false,message:error instanceof Error?`Не удалось сохранить: ${error.message}`:"Не удалось обновить событие"}}
  revalidatePath("/admin/events");redirect("/admin/events");
}

export async function updateEventStatus(formData:FormData){await requireAdmin();const id=String(formData.get("id"));const status=String(formData.get("status")) as "DRAFT"|"PUBLISHED"|"REJECTED"|"CANCELLED";await prisma.$transaction(async tx=>{const event=await tx.event.update({where:{id},data:{status,moderationStatus:status==="PUBLISHED"?"APPROVED":status==="REJECTED"?"REJECTED":undefined,publishedAt:status==="PUBLISHED"?new Date():undefined}});await tx.moderationLog.create({data:{eventId:id,actorId:"environment-admin",action:status==="PUBLISHED"?"PUBLISHED":status==="REJECTED"?"REJECTED":status==="CANCELLED"?"CANCELLED":"EDITED",after:{status:event.status}}})});revalidatePath("/admin");revalidatePath("/admin/events");revalidatePath("/admin/moderation");revalidatePath("/","layout")}

export async function createSource(_:AdminFormState,formData:FormData):Promise<AdminFormState>{await requireAdmin();const parsed=sourceFormSchema.safeParse(values(formData));if(!parsed.success)return {ok:false,message:"Проверьте заполненные поля",errors:parsed.error.flatten().fieldErrors};const d=parsed.data;try{await prisma.source.create({data:{name:d.name,type:d.type,url:d.url,cityId:d.cityId||null,trustScore:d.trustScore,collectionMethod:d.collectionMethod,active:d.active,config:d.config as object|undefined}})}catch(error){return {ok:false,message:error instanceof Error?`Не удалось сохранить: ${error.message}`:"Не удалось создать источник"}}revalidatePath("/admin/sources");redirect("/admin/sources")}
export async function updateSource(id:string,_:AdminFormState,formData:FormData):Promise<AdminFormState>{await requireAdmin();const parsed=sourceFormSchema.safeParse(values(formData));if(!parsed.success)return {ok:false,message:"Проверьте заполненные поля",errors:parsed.error.flatten().fieldErrors};const d=parsed.data;try{await prisma.source.update({where:{id},data:{name:d.name,type:d.type,url:d.url,cityId:d.cityId||null,trustScore:d.trustScore,collectionMethod:d.collectionMethod,active:d.active,config:d.config as object|undefined}})}catch(error){return {ok:false,message:error instanceof Error?`Не удалось сохранить: ${error.message}`:"Не удалось обновить источник"}}revalidatePath("/admin/sources");redirect("/admin/sources")}
export async function toggleSource(formData:FormData){await requireAdmin();const id=String(formData.get("id"));const active=String(formData.get("active"))==="true";await prisma.source.update({where:{id},data:{active}});revalidatePath("/admin/sources")}
export async function retryRawEvent(formData:FormData){await requireAdmin();const id=String(formData.get("id"));await prisma.rawEvent.update({where:{id},data:{processingStatus:"NEW",processingError:null}});revalidatePath("/admin/raw-events");revalidatePath(`/admin/raw-events/${id}`)}
export async function resolveSystemError(formData:FormData){await requireAdmin();await prisma.systemError.update({where:{id:String(formData.get("id"))},data:{resolvedAt:new Date()}});revalidatePath("/admin/errors")}
export async function runCollector(formData:FormData){await requireAdmin();const {collectSource}=await import("@/modules/collectors/service");await collectSource(String(formData.get("id")));revalidatePath("/admin/sources");revalidatePath("/admin/raw-events");revalidatePath("/admin/collector-runs");revalidatePath("/admin/errors")}
export async function processRawEventNow(formData:FormData){await requireAdmin();const {processRawEvent}=await import("@/modules/ai-parser/service");await processRawEvent(String(formData.get("id")));revalidatePath("/admin/raw-events");revalidatePath("/admin/moderation");revalidatePath("/admin/errors")}
export async function decideDuplicate(formData:FormData){await requireAdmin();const {resolveDuplicateCandidate}=await import("@/modules/deduplication/service");await resolveDuplicateCandidate(String(formData.get("id")),String(formData.get("decision"))==="merge"?"merge":"dismiss");revalidatePath("/admin/duplicates");revalidatePath("/admin/events");revalidatePath("/admin/moderation")}
export async function runPublicationPolicy(formData:FormData){await requireAdmin();const {evaluateEventForPublication,evaluatePublicationBatch}=await import("@/modules/publication/service");const id=String(formData.get("id")??"");if(id)await evaluateEventForPublication(id);else await evaluatePublicationBatch(100);revalidatePath("/admin/publication");revalidatePath("/admin/events");revalidatePath("/")}
